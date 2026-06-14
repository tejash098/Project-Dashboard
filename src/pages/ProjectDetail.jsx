import { useParams } from "react-router-dom";
import PageLayout from "../layouts/PageLayout";

const ProjectDetail = () => {
  const { id } = useParams();

  return (
    <PageLayout title="Project Detail">
      <p>Project: {id}</p>
    </PageLayout>
  );
};

export default ProjectDetail;
