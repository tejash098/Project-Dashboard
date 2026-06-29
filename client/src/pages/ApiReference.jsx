import { useMemo } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import PageLayout from "../layouts/PageLayout";
import BackLink from "../components/ui/BackLink";
import { buildOpenApiSpec } from "../utils/openApiSpec";
import { ROUNDED } from "../config/constants";

/**
 * Interactive Swagger UI view of the Project Dashboard API. The spec is generated
 * from the same `apiDocs.js` source of truth that drives the Docs page and the
 * served Markdown (via `buildOpenApiSpec`), so all three stay in sync.
 *
 * Lazy-loaded by the router (see `App.jsx`), so `swagger-ui-react` and its CSS
 * ship in a separate chunk rather than the main bundle. Swagger's bundled light
 * theme is contained on a white card so it reads as intentional in dark mode.
 */
const ApiReference = () => {
  // The spec is static for a session — build it once.
  const spec = useMemo(() => buildOpenApiSpec(), []);

  return (
    <PageLayout
      title="API Reference"
      subtitle="Interactive Swagger UI for the Project Dashboard REST API"
      actions={<BackLink to="/docs" label="Back to docs" />}
    >
      {/* White surface keeps Swagger's light theme legible in app dark mode. */}
      <div className={`${ROUNDED.LG} bg-white p-2 overflow-x-auto`}>
        <SwaggerUI spec={spec} docExpansion="list" />
      </div>
    </PageLayout>
  );
};

export default ApiReference;
