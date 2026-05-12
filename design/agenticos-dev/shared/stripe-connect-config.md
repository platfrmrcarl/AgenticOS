# Stripe Connect Configuration

## Purpose
Automate 50/50 venture payment splits so founder receives
their share automatically without chasing partners.

## Setup Flow
1. Founder triggers Deal Onboarding Agent
2. Deal doc generated and sent for digital signature
3. On signature — Stripe Connect link sent to partner
4. Partner connects their Stripe account
5. Payment split configured automatically (50/50 or agreed terms)
6. Revenue routed to founder business account on every transaction

## Payment Monitoring
- Daily digest of all incoming venture payments
- Real-time alert if payment is late or missing

## Escalation Ladder
- Day 1 late: Friendly email reminder
- Day 2 late: Infrastructure reminder (we control the servers)
- Day 3 late: Ownership reminder (we own 50% of this venture)
- Day 7 late: Final notice before service suspension
- Day 7+: Founder notified, human makes final call

## Human-in-the-Loop
Founder must approve before any infrastructure is taken offline.
Agent handles all reminders. Founder handles the nuclear option.
