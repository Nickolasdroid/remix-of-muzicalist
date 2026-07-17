/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Muzicalist confirmation code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>MUZICALIST</Heading>
        <Heading style={h1}>Confirm it's you</Heading>
        <Text style={text}>Enter the code below in Muzicalist to confirm this action:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code expires in 10 minutes. Never share it with anyone. If you didn't request this, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brand = { fontSize: '14px', letterSpacing: '3px', color: '#0b0b0e', margin: '0 0 24px', fontWeight: 700 as const }
const h1 = { fontSize: '24px', fontWeight: 700 as const, color: '#0b0b0e', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#4a4a55', lineHeight: '1.6', margin: '0 0 20px' }
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '32px',
  fontWeight: 700 as const,
  color: '#0b0b0e',
  letterSpacing: '8px',
  margin: '0 0 32px',
}
const footer = { fontSize: '12px', color: '#8a8a95', margin: '32px 0 0', lineHeight: '1.5' }
