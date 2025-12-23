import { LoadingTemplate } from "@/popup/templates/loading-template.tsx";

export function LoadingPage(props: { error?: string }) {
  return <LoadingTemplate error={props.error} />;
}
