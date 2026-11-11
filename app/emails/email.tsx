
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
} from "@react-email/components";

type InvitationEmailProps = {
  organizationName: string;
  inviterName: string;
  invitationUrl: string;
};

export function InvitationEmail({
  organizationName,
  inviterName,
  invitationUrl,
}: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Heading>You are invited to PortalKit!</Heading>

          <Text>
            {inviterName} has invited you to join{" "}
            {organizationName}.
          </Text>

          <Text>
            Click below to accept your invitation.
          </Text>

          <Button href={invitationUrl}>
            Accept Invitation
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
