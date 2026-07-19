/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

const GOLD = '#f5b301'
const SITE_URL = 'https://muzicalist.com'
const LOGO_URL =
  'https://muzicalist.com/__l5e/assets-v1/4023aaf1-cafa-4e98-b2ad-2daef180891b/muzicalist-logo.png'

export const SignupEmail = ({ confirmationUrl }: SignupEmailProps) => (
  <Html lang="en" dir="ltr" translate="no">
    <Head>
      <meta name="color-scheme" content="dark only" />
      <meta name="supported-color-schemes" content="dark only" />
      <meta name="google" content="notranslate" />
    </Head>
    <Preview>Please confirm your email address to activate your MUZICALIST account.</Preview>
    <Body style={main}>
      <Container style={outer}>
        <Container style={inner}>
          {/* Header */}
          <Section style={{ textAlign: 'center', padding: '24px 24px 24px 24px' }}>
            <Img
              src={LOGO_URL}
              alt="Muzicalist"
              width="80"
              height="80"
              style={{ display: 'block', margin: '0 auto 16px', width: 80, height: 80, border: 0 }}
            />
            <Text style={brandWordmark}>
              <span className="notranslate">MUZICALIST</span>
            </Text>
          </Section>

          {/* Hero */}
          <Section style={{ textAlign: 'center', padding: '8px 32px 8px 32px' }}>
            <Text style={eyebrow}>ACCOUNT CONFIRMATION</Text>
            <Text style={h1}>Confirm your email address</Text>
          </Section>

          {/* Gold divider */}
          <Section style={{ textAlign: 'center', padding: '28px 32px 28px 32px' }}>
            <div style={goldDivider}>&nbsp;</div>
          </Section>

          {/* Body */}
          <Section style={{ padding: '0 32px 8px 32px' }}>
            <Text style={greeting}>
              Welcome to <span className="notranslate">MUZICALIST</span>!
            </Text>
            <Text style={bodyText}>
              Please confirm your email address to activate your account and start discovering
              artists, connecting with clients and exploring the platform.
            </Text>
          </Section>

          {/* CTA */}
          <Section style={{ textAlign: 'center', padding: '36px 32px 12px 32px' }}>
            <Link href={confirmationUrl} target="_blank" style={ctaButton}>
              Confirm my email
            </Link>
          </Section>

          {/* Secondary text */}
          <Section style={{ textAlign: 'center', padding: '24px 40px 8px 40px' }}>
            <Text style={secondary}>
              This link expires in 24 hours. If you didn't create a{' '}
              <span className="notranslate">MUZICALIST</span> account, you can safely ignore
              this email.
            </Text>
          </Section>

          {/* Divider */}
          <Section style={{ padding: '36px 32px 0 32px' }}>
            <Hr style={hrStyle} />
          </Section>

          {/* Footer */}
          <Section style={{ textAlign: 'center', padding: '24px 32px 8px 32px' }}>
            <Text style={footerThanks}>
              Thank you for being part of the{' '}
              <span className="notranslate">MUZICALIST</span> community.
            </Text>
            <Text style={footerTeam}>
              The <span className="notranslate">MUZICALIST</span> Team
            </Text>
            <Text style={footerLink}>
              <Link href={SITE_URL} style={{ color: GOLD, textDecoration: 'none' }}>
                <span className="notranslate">muzicalist.com</span>
              </Link>
            </Text>
          </Section>
        </Container>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = {
  backgroundColor: '#000000',
  fontFamily: 'Arial, Helvetica, sans-serif',
  margin: 0,
  padding: 0,
}
const outer = {
  backgroundColor: '#000000',
  padding: '40px 12px',
  width: '100%',
  maxWidth: '100%',
}
const inner = {
  backgroundColor: '#000000',
  maxWidth: '600px',
  margin: '0 auto',
  padding: 0,
}
const brandWordmark = {
  margin: 0,
  color: '#ffffff',
  fontSize: '22px',
  fontWeight: 800 as const,
  letterSpacing: '4px',
  textAlign: 'center' as const,
  fontFamily: 'Arial, Helvetica, sans-serif',
}
const eyebrow = {
  margin: '0 0 14px 0',
  color: GOLD,
  fontSize: '11px',
  lineHeight: 1,
  fontWeight: 700 as const,
  letterSpacing: '3px',
  textTransform: 'uppercase' as const,
}
const h1 = {
  margin: '0 0 8px 0',
  color: '#ffffff',
  fontSize: '32px',
  lineHeight: 1.15,
  fontWeight: 800 as const,
  letterSpacing: '-0.4px',
}
const goldDivider = {
  width: '56px',
  height: '2px',
  background: GOLD,
  lineHeight: '2px',
  fontSize: 0,
  margin: '0 auto',
}
const greeting = {
  margin: '0 0 14px 0',
  color: '#ffffff',
  fontSize: '17px',
  lineHeight: 1.5,
  fontWeight: 700 as const,
}
const bodyText = {
  margin: '0 0 8px 0',
  color: '#c9c9cf',
  fontSize: '16px',
  lineHeight: 1.7,
}
const ctaButton = {
  display: 'inline-block',
  backgroundColor: GOLD,
  color: '#0b0b0e',
  textDecoration: 'none',
  fontWeight: 700 as const,
  fontSize: '15px',
  lineHeight: 1,
  padding: '18px 40px',
  borderRadius: '999px',
  letterSpacing: '0.3px',
  fontFamily: 'Arial, Helvetica, sans-serif',
}
const secondary = {
  margin: 0,
  color: '#8a8a92',
  fontSize: '13px',
  lineHeight: 1.65,
}
const hrStyle = {
  border: 'none',
  borderTop: '1px solid #1f1f24',
  margin: 0,
}
const footerThanks = {
  margin: '0 0 10px 0',
  color: '#c9c9cf',
  fontSize: '14px',
  lineHeight: 1.6,
}
const footerTeam = {
  margin: '0 0 14px 0',
  color: '#ffffff',
  fontSize: '13px',
  lineHeight: 1.5,
  fontWeight: 700 as const,
  letterSpacing: '0.3px',
}
const footerLink = {
  margin: 0,
  color: '#6b6b73',
  fontSize: '12px',
  lineHeight: 1.5,
}
