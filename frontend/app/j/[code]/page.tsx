import JoinCard from "@/components/join/JoinCard";
import JoinForm from "@/components/join/JoinForm";

// Invite links land here: /j/<meeting id>?pwd=<passcode>. The form arrives prefilled, so only the name is needed.
export default async function InviteLinkPage(props: PageProps<"/j/[code]">) {
  const { code } = await props.params;
  const { pwd } = await props.searchParams;

  return (
    <JoinCard title="Join meeting">
      <JoinForm initialCode={code} initialPasscode={typeof pwd === "string" ? pwd : ""} />
    </JoinCard>
  );
}
