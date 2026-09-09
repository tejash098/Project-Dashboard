import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

/**
 * ChatWidget is the only surface in the app that turns a network failure into
 * readable content instead of a toast, and the only one that replays prior turns
 * back to the server. Neither is visible from the API module, and the second —
 * history built from a three-role transcript — has an obvious way to be quietly
 * wrong: shipping error lines or client-only ids to an endpoint that would 400
 * or answer as though our own failure copy were part of the conversation.
 *
 * The hook is driven through the rendered widget rather than renderHook, the way
 * ToastProvider.test.jsx tests a provider through its output. Everything worth
 * asserting about history is observable from the mock's call arguments.
 */
vi.mock("../services/api/chat", () => ({ sendChatMessage: vi.fn() }));

const { sendChatMessage } = await import("../services/api/chat");
const { default: ChatWidget } = await import("../components/ui/ChatWidget.jsx");
const { default: ToastProvider } = await import("../context/ToastProvider.jsx");
const { CHAT_STARTERS, CHAT_GREETING } = await import("../data/chatStarters.js");

/** A well-formed answer, so each test states only what it varies. */
const answer = {
  reply: "Tejash works across the MERN stack.",
  followUps: ["Where has he worked?", "What is this dashboard?"],
};

/** Open the panel and hand back the launcher for later assertions. */
const openPanel = () => {
  const launcher = screen.getByRole("button", { name: "Ask the assistant" });
  fireEvent.click(launcher);
  return launcher;
};

/** Type into the composer and submit with Enter. */
const typeAndSend = (text) => {
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: text } });
  fireEvent.keyDown(input, { key: "Enter" });
  return input;
};

describe("ChatWidget", () => {
  beforeEach(() => {
    sendChatMessage.mockReset();
    sendChatMessage.mockResolvedValue(answer);
  });

  it("stays closed until the launcher is clicked", () => {
    render(<ChatWidget />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ask the assistant" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("offers the greeting and the starter questions when it opens", () => {
    render(<ChatWidget />);

    openPanel();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(CHAT_GREETING)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: CHAT_STARTERS[0] }),
    ).toBeInTheDocument();
    // The composer takes focus so a visitor can type straight away.
    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("sends a clicked starter and shows the reply", async () => {
    render(<ChatWidget />);
    openPanel();

    fireEvent.click(screen.getByRole("button", { name: CHAT_STARTERS[0] }));

    expect(await screen.findByText(answer.reply)).toBeInTheDocument();
    // The empty-history shape matters: the contract sends [] rather than
    // omitting the field, so every request body has the same shape.
    expect(sendChatMessage).toHaveBeenCalledWith({
      message: CHAT_STARTERS[0],
      history: [],
    });
  });

  it("replaces the starter pills with the reply's follow-ups", async () => {
    render(<ChatWidget />);
    openPanel();

    fireEvent.click(screen.getByRole("button", { name: CHAT_STARTERS[0] }));
    await screen.findByText(answer.reply);

    // The whole point of the server returning followUps: the conversation
    // carries its own next steps, so no client-side question tree is needed.
    expect(
      screen.queryByRole("button", { name: CHAT_STARTERS[0] }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: answer.followUps[0] }),
    ).toBeInTheDocument();
  });

  it("replays the earlier turns as history on the next question", async () => {
    render(<ChatWidget />);
    openPanel();

    typeAndSend("first question");
    await screen.findByText(answer.reply);

    sendChatMessage.mockResolvedValue({ reply: "second", followUps: ["a?", "b?"] });
    typeAndSend("second question");
    await screen.findByText("second");

    // Ids stripped, order preserved — this is what makes a follow-up like
    // "what did he build there?" resolvable.
    expect(sendChatMessage).toHaveBeenLastCalledWith({
      message: "second question",
      history: [
        { role: "user", content: "first question" },
        { role: "assistant", content: answer.reply },
      ],
    });
  });

  it("never replays an error line as part of the conversation", async () => {
    // An error line is client-authored UI copy. Sending it back would have the
    // assistant answering questions about our own failure messages.
    render(<ChatWidget />);
    openPanel();

    sendChatMessage.mockRejectedValueOnce({
      response: { status: 503, data: { message: "The assistant is unavailable right now." } },
    });
    typeAndSend("doomed question");
    await screen.findByText("The assistant is unavailable right now.");

    sendChatMessage.mockResolvedValue(answer);
    typeAndSend("next question");
    await screen.findByText(answer.reply);

    const { history } = sendChatMessage.mock.lastCall[0];
    expect(history).toEqual([{ role: "user", content: "doomed question" }]);
  });

  it("puts a rate-limit failure in the transcript and leaves the composer usable", async () => {
    render(<ChatWidget />);
    openPanel();

    sendChatMessage.mockRejectedValueOnce({
      response: {
        status: 429,
        data: { message: "Rate limit exceeded. Try again in a minute." },
      },
    });
    typeAndSend("one too many");

    expect(
      await screen.findByText("Rate limit exceeded. Try again in a minute."),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox")).not.toBeDisabled();
    // The pills come back, so the visitor is not left staring at a dead panel.
    expect(
      screen.getByRole("button", { name: CHAT_STARTERS[0] }),
    ).toBeInTheDocument();
  });

  it("raises no toast of its own when a request fails", async () => {
    // The axios interceptor already broadcasts api:rate-limited, which
    // ToastProvider surfaces. The mocked module dispatches nothing, so any
    // role="status" here could only have come from the widget calling addToast.
    render(
      <ToastProvider>
        <ChatWidget />
      </ToastProvider>,
    );
    openPanel();

    sendChatMessage.mockRejectedValueOnce({
      response: { status: 429, data: { message: "Rate limit exceeded." } },
    });
    typeAndSend("one too many");
    await screen.findByText("Rate limit exceeded.");

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("hides an unexpected server message behind generic copy", async () => {
    // chatController returns the raw error.message on a 500, which can carry
    // internals. Only 400/429/503 are echoed verbatim.
    render(<ChatWidget />);
    openPanel();

    sendChatMessage.mockRejectedValueOnce({
      response: { status: 500, data: { message: "ECONNREFUSED 10.0.0.4:27017" } },
    });
    typeAndSend("boom");

    expect(
      await screen.findByText("Something went wrong. Please try again."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument();
  });

  it("renders an out-of-reference answer as an ordinary reply", async () => {
    // It is a correct answer, not a failure — and the server still pads two
    // follow-ups onto it, which is the way back to covered ground.
    render(<ChatWidget />);
    openPanel();

    sendChatMessage.mockResolvedValue({
      reply: "Out of reference.",
      followUps: ["What is his background?", "How do I get in touch?"],
    });
    typeAndSend("what is the weather in Tokyo?");

    const reply = await screen.findByText("Out of reference.");
    expect(reply.className).not.toMatch(/danger/);
    expect(
      screen.getByRole("button", { name: "What is his background?" }),
    ).toBeInTheDocument();
  });

  it("sends on Enter but starts a new line on Shift+Enter", () => {
    render(<ChatWidget />);
    openPanel();

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "shift enter" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(sendChatMessage).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: "Enter" });
    expect(sendChatMessage).toHaveBeenCalledTimes(1);
  });

  it("keeps the conversation when the panel is closed and reopened", async () => {
    // State lives on ChatWidget, not the panel — which is what lets the
    // transcript survive navigation too, since AppShell sits outside <Routes>.
    render(<ChatWidget />);
    openPanel();

    typeAndSend("remember this");
    await screen.findByText(answer.reply);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    openPanel();
    expect(screen.getByText(answer.reply)).toBeInTheDocument();
  });

  it("returns focus to the launcher when Escape closes the panel", () => {
    render(<ChatWidget />);
    const launcher = openPanel();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(launcher).toHaveFocus();
  });

  it("closes from the panel's own close button", () => {
    render(<ChatWidget />);
    openPanel();

    fireEvent.click(screen.getByRole("button", { name: "Close the assistant" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the launcher and the close button distinguishable by name", () => {
    // The launcher's name stays put and aria-expanded carries its state. If it
    // flipped to "Close the assistant" instead, a screen reader would list two
    // identically named controls with no way to tell them apart.
    render(<ChatWidget />);
    openPanel();

    expect(
      screen.getByRole("button", { name: "Ask the assistant" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getAllByRole("button", { name: "Close the assistant" }),
    ).toHaveLength(1);
  });

  it("exposes the transcript as a polite live region", () => {
    render(<ChatWidget />);
    openPanel();

    const log = screen.getByRole("log");
    expect(log).toHaveAttribute("aria-live", "polite");
    expect(log).toHaveAttribute("aria-label", "Conversation");
  });
});
