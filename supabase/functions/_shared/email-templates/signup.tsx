/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email to activate your Muzicalist account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>MUZICALIST</Heading>
        <Heading style={h1}>Confirm your email</Heading>
        <Text style={text}>
          Welcome to Muzicalist! Please confirm your email address (
          <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>
          ) to activate your account and get started.
        </Text>
        <Button style={button} href={confirmationUrl}>Confirm my email</Button>
        <Text style={footer}>
          This link expires in 24 hours. If you didn't create a Muzicalist account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brand = { fontSize: '14px', letterSpacing: '3px', color: '#0b0b0e', margin: '0 0 24px', fontWeight: 700 as const }
const h1 = { fontSize: '24px', fontWeight: 700 as const, color: '#0b0b0e', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#4a4a55', lineHeight: '1.6', margin: '0 0 24px' }
const link = { color: '#0b0b0e', textDecoration: 'underline' }
const button = {
  backgroundColor: '#f5b301',
  color: '#0b0b0e',
  fontSize: '15px',
  fontWeight: 700 as const,
  borderRadius: '10px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#8a8a95', margin: '32px 0 0', lineHeight: '1.5' }
