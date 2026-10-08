import MeetingRoom from "@/components/meeting/MeetingRoom";

// Server component: reads the URL, then hands off to the interactive client component
export default async function MeetingPage(props: PageProps<"/meeting/[code]">) {
  const { code } = await props.params;
  const { pwd, host, name } = await props.searchParams;

  return (
    <MeetingRoom
      code={code}
      passcode={typeof pwd === "string" ? pwd : ""}
      isHost={host === "1"}
      displayName={typeof name === "string" ? name : ""}
    />
  );
}
