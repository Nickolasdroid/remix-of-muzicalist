/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ confirmationUrl }: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to Muzicalist</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>MUZICALIST</Heading>
        <Heading style={h1}>You've been invited to Muzicalist</Heading>
        <Text style={text}>
          Accept the invitation below to create your account and start connecting with artists and organizers on Muzicalist.
        </Text>
        <Button style={button} href={confirmationUrl}>Accept invitation</Button>
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brand = { fontSize: '14px', letterSpacing: '3px', color: '#0b0b0e', margin: '0 0 24px', fontWeight: 700 as const }
const h1 = { fontSize: '24px', fontWeight: 700 as const, color: '#0b0b0e', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#4a4a55', lineHeight: '1.6', margin: '0 0 24px' }
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
