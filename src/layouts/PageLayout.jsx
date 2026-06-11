/**
 * Inner page wrapper providing consistent title and content spacing.
 * Every page wraps its content in this component.
 *
 * @param {string}           title    - Page heading displayed at the top.
 * @param {React.ReactNode}  children - Page body content.
 */
const PageLayout = ({ title, children }) => {
    return (
        <div className="max-w-7xl mx-auto">

            {/* ── Page heading ── */}
            {title && (
                <h1 className="
                    text-2xl font-semibold
                    text-text-primary
                    mb-6
                ">
                    {title}
                </h1>
            )}

            {/* ── Page body ── */}
            <div className="text-text-secondary">
                {children}
            </div>

        </div>
    );
};

export default PageLayout;