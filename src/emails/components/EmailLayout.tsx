import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
} from "@react-email/components";
import { BRAND } from "../constants";

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export default function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={cardOuterStyle}>
            <Section style={cardAccentStyle} />

            <Section style={cardStyle}>
              <Text style={logoTextStyle}>
                <span style={logoCrushStyle}>Crush</span>
                <span style={logoSvgStyle}>SVG</span>
              </Text>

              {children}
            </Section>
          </Section>

          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              {BRAND.appName} &copy; {new Date().getFullYear()}
            </Text>
            <Text style={footerMutedStyle}>
              If you didn&apos;t request this email, you can safely ignore it.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  backgroundColor: "#F7F2ED",
  fontFamily: BRAND.fontFamily,
  margin: 0,
  padding: "40px 16px",
};

const containerStyle = {
  maxWidth: "520px",
  margin: "0 auto",
};

const cardOuterStyle = {
  backgroundColor: BRAND.bg,
  borderRadius: "16px",
  overflow: "hidden" as const,
  boxShadow: "0 4px 24px rgba(217, 74, 30, 0.10), 0 1px 4px rgba(0, 0, 0, 0.04)",
};

const cardAccentStyle = {
  height: "4px",
  background: `linear-gradient(90deg, ${BRAND.primary} 0%, ${BRAND.accent} 100%)`,
};

const cardStyle = {
  padding: "40px 36px 36px",
  textAlign: "center" as const,
};

const logoTextStyle = {
  fontFamily: BRAND.fontDisplay,
  fontSize: "26px",
  fontWeight: 800,
  letterSpacing: "-0.5px",
  margin: "0 0 24px",
};

const logoCrushStyle = {
  color: BRAND.text,
};

const logoSvgStyle = {
  color: BRAND.primary,
};

const footerStyle = {
  paddingTop: "24px",
  textAlign: "center" as const,
};

const footerTextStyle = {
  fontSize: "12px",
  color: "#A8A0C0",
  margin: 0,
  lineHeight: "1.6",
};

const footerMutedStyle = {
  fontSize: "11px",
  color: "#C0B8D0",
  margin: "8px 0 0",
  lineHeight: "1.5",
};