# CommuteSaathi — Product Requirements Document (PRD)

**Document status:** Detailed working specification for product, design, engineering, operations, and pilot planning  
**Version:** 2.0  
**Last updated:** 23 October 2026  
**Product category:** Recurring commute subscriptions, on-demand rides, fleet dispatch, and optional shared rides  
**Geographic scope:** City-agnostic; launch market to be selected during pilot planning  
**Primary users:** Passengers, transport operators/fleet managers, drivers, and platform support/admin teams

---

## 1. Executive Summary

CommuteSaathi is a managed commute platform for people who repeatedly travel between the same locations. Instead of searching for an auto or cab, negotiating a fare, and arranging transport from scratch every day, a passenger can define a commute once and subscribe to a service for a month, academic term, or year. The platform coordinates the recurring schedule, operator, vehicle, driver assignments, payment terms, notifications, and backup coverage.

The core product promise is **a dependable commute service, not a promise that one particular driver will always arrive**. A fleet operator may assign a primary driver and vehicle, but the passenger does not need to recruit or personally manage that driver. If the primary driver is unavailable, the operator's dispatch workflow attempts to assign a qualified replacement. A replacement is valid only if it meets the booking's vehicle, route, timing, verification, and service-category constraints.

CommuteSaathi supports three important passenger scenarios:

1. **Student:** travels to college on a repeated weekly schedule and wants a budget-aware, predictable journey without daily booking friction.
2. **Woman passenger:** wants a dependable commute and may specifically choose a women-only service. Women-only eligibility must remain enforced during matching and driver substitution; the system must never silently downgrade the booking to Standard.
3. **Working professional:** travels to work on a fixed schedule, wants reliable pickups and clear fare terms, and may choose individual or shared rides.

The service can support individual rides and shared rides. Shared rides are offered only when route, timing, capacity, service category, and safety constraints are satisfied. A women-only shared ride may include eligible women passengers only and must follow the configured driver eligibility policy. Passengers who share a completed trip can rate one another, subject to trip-membership verification, anti-abuse controls, privacy protections, and a separate safety-reporting process.

The platform serves passengers and fleet operators. Passengers gain reduced coordination effort, transparent terms, and a defined recovery process when plans fail. Operators gain a recurring demand pipeline, dispatch tools, driver/vehicle utilization visibility, and a way to manage substitutions. Drivers may benefit from more predictable assigned work, but CommuteSaathi must not advertise guaranteed driver income unless the relevant operator contractually guarantees the amount and conditions.

This PRD defines the product scope, user journeys, operational workflows, edge cases, permissions, data model, service states, acceptance criteria, success metrics, risks, and staged delivery plan. It is a product and implementation specification, not a claim that transport licensing, insurance, payment, employment, or privacy requirements have already been legally validated.

---

## 2. Product Vision and Principles

### 2.1 Vision

Make repeated daily travel feel like a managed service: the passenger defines when and where they travel, while an operator-backed system handles assignment, dispatch, communication, payment, and recovery.

### 2.2 Product principles

1. **Reliability is the product.** Booking a vehicle is not enough; the system must handle driver absence, vehicle breakdown, delays, route changes, and operator capacity shortages.
2. **Subscribe to the service, not necessarily to a person.** The passenger may see a primary driver when assigned, but the operator owns staffing and backup coordination.
3. **Never promise capacity that does not exist.** Do not confirm a subscription as fully serviceable until an operator has accepted it and the required recurring capacity is available or explicitly marked as pending.
4. **No silent category downgrade.** Standard, Women-Only, vehicle, accessibility, and other eligibility constraints must survive every reassignment and shared-ride match.
5. **Transparent price and terms.** Show what is included, what can change, cancellation rules, waiting charges, refunds, holidays, and service limitations before payment.
6. **Safety is separate from ratings.** A low star rating is not a substitute for a safety incident report, and a safety report must not depend on a public rating.
7. **Privacy by default.** Share only the personal and location data needed for a specific operational purpose.
8. **Operational reality over marketing claims.** Claims about backup availability, driver income, punctuality, and safety must be supported by actual supply, process, and contractual commitments.
9. **Recovery is part of the workflow.** Every failed assignment, missed pickup, payment failure, or cancelled commute needs a clear status and next action.
10. **City-agnostic architecture.** The initial launch may be in one city or corridor, but product logic must not hard-code a specific city, campus, employer, or transport mode.

---

## 3. Problem Statement

### 3.1 Passenger problems

People who travel to the same destination regularly may face:
- Repeatedly searching for a ride and entering the same journey details.
- Uncertain driver availability during peak hours.
- Variable fares, fare negotiation, and uncertainty about extra charges.
- Late pickups or cancellations with little time to find an alternative.
- Inconvenient first/last-mile connections to public transport.
- Difficulty coordinating shared rides with people on compatible routes.
- Safety and trust concerns, particularly for passengers who need a women-only service.
- Unclear responsibility when a driver is unavailable: passenger, platform, or operator.
- Lack of a clear monthly plan that defines service days, absences, holidays, and refund rules.

### 3.2 Operator problems

Fleet operators may face:
- Unpredictable daily demand and poor forward visibility.
- Manual allocation of drivers and vehicles to recurring routes.
- Last-minute absences, vehicle breakdowns, and dispatch gaps.
- Difficulty communicating schedule changes to many passengers.
- No single view of subscription commitments, capacity, driver availability, and service-level performance.
- Disputes about fares, waiting time, cancellations, and driver compensation.

### 3.3 Driver problems

Drivers may face:
- Inconsistent demand and unplanned idle time.
- Confusing schedules or last-minute assignment changes.
- Unclear compensation for recurring service, waiting, dead mileage, or cancelled trips.
- Poor visibility into the next day's workload.

CommuteSaathi can improve planning and visibility, but does not by itself guarantee earnings or employment stability.

---

## 4. Goals, Non-Goals, and Success Definition

### 4.1 Goals

- Allow a passenger to create a recurring commute schedule once and manage it over time.
- Offer monthly, academic/term-based, and annual subscriptions, subject to operator capacity and plan availability.
- Let operators assign primary drivers and vehicles and manage backup assignments.
- Reduce daily passenger effort compared with arranging every trip manually.
- Provide clear fare terms and an auditable record of bookings, assignments, payments, cancellations, and refunds.
- Support individual and shared rides where feasible.
- Provide Standard and Women-Only service categories with strict eligibility enforcement.
- Support post-trip passenger-to-passenger ratings only for passengers who actually shared that completed trip.
- Give support staff tools to investigate service failures and resolve disputes.
- Measure actual reliability, replacement success, on-time performance, passenger retention, operator economics, and safety signals.

### 4.2 Non-goals for the initial MVP

- Owning or purchasing vehicles.
- Employing every driver directly; the operating model may use verified fleet partners, subject to legal review.
- Guaranteeing the same driver for every trip.
- Guaranteeing driver earnings unless a separate contract explicitly provides a minimum.
- Building an open social network or public passenger profiles.
- Allowing arbitrary strangers to join a shared trip after dispatch is locked.
- Automatically switching Women-Only rides to Standard.
- Predicting or claiming that a route is perfectly safe.
- Replacing emergency services or official complaint channels.
- Expanding to intercity travel, parcel delivery, school transport for minors, or complex corporate billing before separate requirements are defined.
- Treating star ratings as proof of misconduct or as the only safety mechanism.

### 4.3 Success definition

The product is successful when passengers can create a plan, receive confirmed assignments, complete scheduled commutes reliably, understand charges, and get a clear resolution when service fails—and operators can deliver those commitments with sustainable capacity and economics.

---

## 5. Product Scope and Service Types

### 5.1 Core service types

**A. Recurring Commute Subscription**
- Repeating days and time windows.
- Monthly, term-based, or annual duration.
- One-way or return journeys.
- Individual or shared ride preference.
- Defined pickup/drop-off locations and permitted pickup window.
- Operator-managed primary and backup driver/vehicle assignments.
- Billing and cancellation terms shown before confirmation.

**B. One-Time Scheduled Ride**
- A ride requested for a future date/time.
- Operator/driver assignment and confirmation.
- Same safety, service-category, and cancellation rules as applicable.

**C. On-Demand Ride**
- A ride requested for near-immediate pickup.
- Included only if the launch market and operator supply can support it.
- May be deferred from MVP to avoid diluting the recurring-commute focus.

**D. Shared Ride**
- Multiple passengers travel in the same vehicle for compatible portions of a route.
- Matching considers route overlap, pickup/drop-off order, timing, capacity, maximum detour, price, service category, and passenger eligibility.
- Every passenger must see the expected pickup window, drop-off estimate, price, and sharing disclosure before confirming.

### 5.2 Service categories

**Standard**
- Available to eligible users under the platform's general rules.
- Vehicle and passenger eligibility follow operator and local requirements.

**Women-Only**
- A distinct service category selected explicitly by the passenger.
- Only eligible women passengers may be matched into a Women-Only shared trip.
- Driver eligibility follows the product's configured policy and local legal/operational feasibility; where the service promises a verified woman driver, that promise must be enforced.
- A substitute driver must satisfy the same eligibility requirements.
- If no eligible driver or compatible passenger match is available, the system must keep the booking pending, offer a clearly labelled alternative only with explicit passenger consent, or cancel/refund according to policy. It must never silently downgrade to Standard.

**Other future eligibility profiles**
- Accessible vehicle, specific vehicle type, employer-sponsored, campus-approved, or other constrained categories may be added later.
- Every category must define its eligibility rules, supply requirements, fallback policy, disclosure, and audit trail before launch.

### 5.3 Ride modes

- **Individual:** one booking party occupies the vehicle, subject to vehicle capacity and policy.
- **Shared:** separate passenger parties share a vehicle under an agreed matching and pricing policy.
- **Preference handling:** the passenger may mark shared rides as preferred, allowed, or not allowed. The product must not convert an individual booking to shared without explicit consent.

---

## 6. User Personas and Real-Life Scenarios

### 6.1 Persona A — Student commuting to college

**Situation:** A student travels from home to college five days per week. The route is not conveniently covered end-to-end by public transport. Daily auto booking creates repeated searching, waiting, fare uncertainty, and stress before classes.

**Desired outcome:** A budget-aware monthly or academic-term commute with a known schedule and fewer daily decisions.

**Typical flow:**
1. Student creates an account and completes required verification.
2. Student saves home pickup and college destination.
3. Student chooses weekdays, arrival target, pickup window, one-way/return, and vehicle preference.
4. Student selects Standard or Women-Only if eligible and offered.
5. Student chooses individual or shared ride preference.
6. Platform displays available plan options, fare inclusions, exclusions, holidays, cancellation terms, and capacity status.
7. Student requests a plan. Operator reviews route coverage and recurring capacity.
8. Once accepted, student receives plan confirmation and the assignment policy.
9. Before each scheduled commute, the platform confirms the driver/vehicle or clearly indicates that assignment is still being resolved.
10. If the primary driver is unavailable, the operator assigns an eligible backup and notifies the student.
11. Student completes the trip, can report a problem, and can rate eligible trip participants.
12. Student renews, pauses, changes, or cancels under the published plan rules.

**Failure case:** The operator cannot guarantee capacity on a requested route. The platform must not charge for a confirmed service it cannot supply without clear consent. It should show a waitlist or alternative plan, or reject the request with a reason.

### 6.2 Persona B — Woman passenger choosing a Women-Only commute

**Situation:** A woman travels to work or college at a recurring time. She wants predictable transport and explicitly chooses a Women-Only service due to her personal safety preferences.

**Desired outcome:** A service that consistently respects the selected category, provides verified assignment information according to policy, and handles shortages honestly.

**Typical flow:**
1. Passenger completes required account and eligibility checks.
2. She creates a recurring route and selects **Women-Only**.
3. The plan page explains passenger eligibility, driver eligibility policy, sharing rules, verification, cancellation, and what happens when an eligible replacement is unavailable.
4. Operator accepts only if the service can be supported or clearly marks the request as awaiting capacity confirmation.
5. For each trip, the dispatcher assigns a driver and vehicle that satisfy the Women-Only rules.
6. If the assigned driver cancels, the system searches only for eligible replacements.
7. If a replacement is found, the passenger is notified of the new assignment and relevant verification details.
8. If no eligible replacement exists, the booking remains unresolved only until the defined cutoff. The passenger is notified and offered a refund, rescheduling, or another category only if she explicitly opts in.
9. Shared matching includes only eligible passengers. New passengers cannot be added after the applicable dispatch lock unless the system revalidates eligibility and obtains required consent.
10. After the trip, the passenger can rate other passengers who shared that exact completed trip and can separately report a safety incident.

**Critical invariant:** Women-Only must not silently become Standard because of a shortage, timeout, driver cancellation, route change, or shared-match failure.

### 6.3 Persona C — Working professional (male)

**Situation:** A male professional travels to the same office six days per week. He needs to arrive on time, dislikes negotiating fares, and wants fewer transport-related decisions.

**Desired outcome:** A recurring service with clear price terms, schedule controls, and an operator-managed backup process.

**Typical flow:**
1. Professional enters commute details and workdays.
2. He selects a monthly or annual plan, subject to available service.
3. He reviews fare, waiting policy, included trips, holiday rules, extra-trip pricing, and refund/cancellation conditions.
4. Operator accepts the plan and assigns primary resources.
5. The app sends reminders and trip-specific assignment confirmations.
6. If the primary driver is unavailable, dispatch assigns a suitable backup.
7. If shared rides are enabled, the system may offer a compatible match and disclose any detour and price change before confirmation.
8. The passenger sees trip status, pickup instructions, and support options.
9. He can mark leave days, request schedule changes, or cancel the plan according to its terms.
10. After completed shared trips, he can rate only passengers who were on that trip.

### 6.4 Persona D — Fleet/operator manager

**Situation:** An operator manages many vehicles and drivers, possibly across several routes and time windows.

**Desired outcome:** A single workspace to manage subscription capacity, assign primary and backup resources, resolve absences, monitor service reliability, and track commercial obligations.

**Typical flow:**
1. Operator registers the business and submits required documents.
2. Platform verifies the operator and configures service area, vehicles, driver roster, categories, operating hours, prices, and capacity.
3. Operator reviews subscription requests and capacity impact across all requested days and times.
4. Operator accepts, rejects, or proposes an alternative with passenger consent.
5. Operator assigns primary driver/vehicle and sets eligible backup pools.
6. Dispatch monitors daily trip manifests and driver confirmations.
7. Absence, breakdown, lateness, or cancellation triggers a replacement workflow.
8. Operator confirms the replacement and the platform notifies affected passengers.
9. Operator reviews completion, cancellations, incidents, refunds, ratings, and driver compensation records.
10. Operator can suspend unavailable resources, but cannot erase historical assignments or incident records.

### 6.5 Persona E — Driver

**Situation:** A driver receives recurring work from an operator and needs clear schedules, pickup instructions, compensation terms, and a simple way to report inability to serve a trip.

**Desired outcome:** Fewer ambiguous assignments, clear acceptance deadlines, and fair visibility into completed and cancelled work.

**Typical flow:**
1. Driver completes verification and vehicle eligibility checks as required.
2. Driver receives a proposed recurring schedule or trip assignment.
3. Driver accepts or declines within the defined response window.
4. Accepted assignments appear in a daily manifest.
5. Driver can report sickness, vehicle breakdown, delay, or emergency using a reason code.
6. The system informs dispatch and begins replacement search.
7. Driver receives updated status and does not see passenger private data beyond operational need.
8. Completed trips are recorded for payment reconciliation and performance monitoring.
9. Driver can dispute an incorrect trip, compensation entry, or rating under the published process.

### 6.6 Persona F — Support and safety operations

**Desired outcome:** Resolve booking, payment, dispatch, rating, and safety cases with clear evidence, access controls, and an auditable timeline.

Support staff should see only the data needed for the case, record actions and outcomes, escalate urgent safety reports, and never edit historical trip evidence without an audit record.

---

## 7. Roles, Permissions, and Account States

### 7.1 Roles

- **Passenger:** manage own profile, plans, bookings, payments, reports, and eligible ratings.
- **Driver:** view assigned trips, accept/decline, update operational status, report unavailability, and view relevant trip details.
- **Operator dispatcher:** manage assigned fleet's schedules, driver/vehicle assignments, substitutions, and service recovery.
- **Operator administrator:** manage operator profile, fleet roster, service area, pricing configuration, staff permissions, and reporting.
- **Platform support:** investigate customer cases and process permitted adjustments.
- **Safety specialist:** access restricted incident data for safety handling.
- **Platform administrator:** configure service rules and manage verified operators; all privileged actions must be logged.

### 7.2 Account states

- `PENDING_VERIFICATION`
- `ACTIVE`
- `RESTRICTED`
- `SUSPENDED`
- `CLOSED`

Only active and appropriately verified accounts can perform actions that require verification. A restricted account may retain access to receipts, active support cases, or legally required records while being blocked from new bookings.

### 7.3 Permission principles

- Operators can manage only their own fleet and assigned bookings.
- Drivers cannot browse all passengers or other drivers.
- Passengers cannot see another passenger's private contact information by default.
- Ratings and incident reports are visible only according to their separate privacy policies.
- Support access is purpose-limited and audited.
- No role may delete completed-trip records, payment ledgers, or safety audit events through ordinary UI actions.

---

## 8. End-to-End Passenger Workflows

### 8.1 New passenger onboarding

1. Passenger opens the app or web experience.
2. Passenger enters phone/email and verifies the account using the supported authentication method.
3. Passenger provides only required profile information.
4. If service category or local regulation requires identity/eligibility verification, the app explains why, what is collected, who can see it, and how long it is retained.
5. Passenger accepts terms, privacy notice, cancellation terms, and safety guidance.
6. Passenger may save common locations with clear labels, such as Home, College, or Office.
7. Passenger can skip nonessential profile details and complete them later.
8. If verification fails, the app explains the next step and offers support or appeal where applicable.

**Edge cases**
- OTP delayed or expired: allow resend after cooldown; invalidate old codes.
- Duplicate account: provide safe account recovery rather than exposing whether a private account exists unnecessarily.
- User loses phone access: provide verified recovery process.
- User declines optional data: continue where legally and operationally possible.
- User requests account deletion: explain active bookings, financial records, incident retention, and applicable legal exceptions.

### 8.2 Create a recurring commute plan

1. Passenger selects **Create Commute Plan**.
2. Passenger enters pickup and destination using map search or saved places.
3. Passenger confirms the actual pickup point and any safe, legal pickup instructions.
4. Passenger chooses one-way, return, or separate outbound/return schedules.
5. Passenger chooses travel days, start date, end date or duration, departure time or arrival target, and allowable pickup window.
6. Passenger chooses vehicle class and any supported constraints.
7. Passenger selects Standard or Women-Only, if available and eligible.
8. Passenger chooses ride mode: Individual, Shared Preferred, Shared Allowed, or Individual Only.
9. Platform validates the route, service area, estimated journey duration, operating hours, schedule conflicts, and required eligibility.
10. Platform presents plan options and a transparent fare breakdown.
11. Passenger reviews included trips, holiday rules, waiting policy, cancellation, rescheduling, missed-trip, refund, and service-failure terms.
12. Passenger submits a plan request.
13. Operator reviews recurring capacity across every requested time slot, not merely one sample trip.
14. Operator accepts, rejects, or proposes an alternative schedule/price/route.
15. Passenger must explicitly accept any material change.
16. Payment authorization or initial payment occurs according to the plan's disclosed policy.
17. The plan becomes `ACTIVE` only when the required operator capacity and payment conditions are satisfied. Otherwise it remains `PENDING_OPERATOR_CONFIRMATION`, `PENDING_PAYMENT`, or `WAITLISTED`.
18. Passenger receives confirmation, plan ID, schedule summary, fare terms, and the assignment/backup policy.

**Edge cases**
- Pickup or destination outside service area: reject with reason or offer an alternative point for explicit acceptance.
- Route is serviceable only on some days: offer a clearly scoped partial plan; never imply full-week coverage.
- Operator accepts only one direction: require passenger consent to modify.
- Capacity changes before activation: keep pending, offer alternatives, or cancel/refund under policy.
- Duplicate plan request: detect likely duplicates and ask whether to continue or open the existing request.
- Start date is in the past: prevent activation and request a valid start date.
- Passenger changes route after activation: run capacity and fare recalculation; apply only after acceptance and operator confirmation.
- Passenger selects an unavailable vehicle/category: show unavailable status and alternatives without silently changing the selection.
- Payment succeeds but plan activation fails: create a payment reconciliation case and refund/reverse according to policy.

### 8.3 Daily trip preparation and confirmation

1. The system generates trip instances from the active plan schedule.
2. Before the dispatch cutoff, the operator assigns a primary driver and vehicle or confirms an existing recurring assignment.
3. Driver must acknowledge the trip or be marked as not confirmed by the response deadline.
4. The system checks driver eligibility, vehicle eligibility, schedule conflicts, vehicle capacity, service category, route, and driver hours/rest policy where applicable.
5. Passenger receives the assignment details according to the product's disclosure policy.
6. A pre-trip reminder is sent at configurable intervals.
7. Passenger can view trip status: `SCHEDULED`, `ASSIGNMENT_PENDING`, `CONFIRMED`, `DRIVER_EN_ROUTE`, `ARRIVED`, `IN_PROGRESS`, `COMPLETED`, or a relevant exception state.
8. If the assignment is unresolved at the defined cutoff, dispatch escalation begins automatically.
9. The passenger is told what is known, what is unresolved, and when the next update will arrive.

**Edge cases**
- Driver does not acknowledge: dispatch seeks another driver before the cutoff.
- Driver accepts but later becomes unavailable: reopen replacement workflow.
- Notification fails: retain in-app status and retry alternate configured channels; do not assume delivery.
- Passenger has no network: dispatch and support still use server-side trip state; critical updates may use supported SMS/call channels.
- Assignment changes repeatedly: limit churn, escalate to human dispatcher, and communicate the latest confirmed assignment clearly.
- Passenger changes the trip after dispatch lock: require dispatch revalidation and inform all affected shared passengers.

### 8.4 Pickup and trip execution

1. Driver marks `DRIVER_EN_ROUTE` when appropriate.
2. Passenger sees estimated arrival only if the system has a valid basis; never fabricate precise ETAs.
3. Driver marks `ARRIVED` at the designated pickup area.
4. A configurable waiting timer begins and is visible to both parties.
5. Driver and passenger use masked communication or in-app messaging where available.
6. Trip starts only after the appropriate pickup/verification step.
7. For shared trips, the route follows the locked pickup/drop-off order unless dispatch revalidates a change.
8. Trip completion is recorded using the agreed completion mechanism.
9. Payment capture or settlement occurs according to the plan's billing model.
10. Passenger receives receipt, trip summary, and relevant rating/report options.

**Edge cases**
- Passenger is late: apply disclosed grace period and waiting fee policy; provide cancellation or contact options.
- Driver is late: update status, trigger escalation after threshold, and apply service-credit/refund policy if applicable.
- Wrong pickup point: confirm the safe/legal alternative with passenger and driver; recalculate price/time if material.
- Passenger no-show: record evidence and apply only disclosed terms.
- Driver no-show: classify as operator/service failure, not passenger no-show.
- Vehicle differs from confirmed class: passenger may decline; do not charge a downgrade/upgrade fee without consent.
- Route deviation: allow legitimate traffic or road closures, but provide support/report path for suspicious deviation.
- Trip is interrupted: mark `INTERRUPTED`, capture reason, prioritize passenger safety, and dispatch a replacement or safe resolution where feasible.
- GPS unavailable: allow manual operational updates with audit trail; do not block all service solely because GPS is unavailable.
- Passenger and driver dispute completion: create a review case and avoid duplicate charging.

---

## 9. Fixed Commute Subscription and Fleet-Backed Driver Assurance

This is a central differentiator and must be implemented as a first-class workflow, not as a simple saved-driver preference.

### 9.1 Service promise

The passenger purchases a defined commute service for a period. The operator is responsible for staffing and vehicle dispatch within the agreed terms. A primary driver may be assigned for continuity, but the service remains valid if an eligible replacement is dispatched.

The platform must distinguish:
- **Driver preference:** passenger likes a particular driver, but service is not dependent on that driver.
- **Primary assignment:** operator's intended default driver/vehicle.
- **Backup pool:** verified, available, eligible resources that may cover an absence.
- **Confirmed trip assignment:** driver/vehicle that has accepted the specific trip and passed all checks.
- **Service guarantee:** a contractual commitment with defined remedies, not just an app label.

### 9.2 Subscription durations

Support configurable plan lengths:
- Monthly.
- Academic or work term.
- Annual.
- Custom fixed-duration plan, if operator supports it.

The product must not assume that a monthly or annual subscription automatically means unlimited rides. The plan must specify included days/trips, direction(s), pickup window, allowed changes, excluded holidays, and overage charges.

### 9.3 Plan configuration fields

Required or conditionally required:
- Pickup and destination.
- Recurring days of week.
- One-way or return journeys.
- Departure time or arrival target.
- Pickup window and maximum waiting policy.
- Start and end date.
- Vehicle class.
- Standard/Women-Only category.
- Individual/shared ride policy.
- Passenger count and accessibility needs, if supported.
- Price and included service units.
- Holiday calendar or excluded dates.
- Passenger leave/pause policy.
- Cancellation, refund, and renewal policy.
- Operator/service area.
- Service commitment and recovery policy.
- Whether a primary driver is assigned and whether a named-driver preference is supported.

### 9.4 Operator capacity check

Before accepting a subscription, the system must evaluate:
- Number of scheduled trips by day and time.
- Driver availability and legal/operational working-hour limits.
- Vehicle availability and vehicle capacity.
- Required service category and driver eligibility.
- Route and travel-time feasibility.
- Backup pool size and competing commitments.
- Existing active subscriptions that use the same capacity.
- Expected leave, maintenance, holidays, and known exclusions.

A single driver should not be assigned to overlapping trips that cannot reasonably be served. A vehicle or driver cannot be treated as backup if already committed to a conflicting trip.

### 9.5 Primary and backup assignment workflow

1. Operator receives a plan request.
2. System evaluates recurring capacity and identifies possible primary resources.
3. Operator selects a primary driver and vehicle or a pool-based assignment.
4. Driver confirms the recurring schedule within the response deadline.
5. Operator configures one or more backup resources or an explicit dispatch escalation path.
6. The plan is activated only when required capacity checks pass and the operator accepts responsibility under the plan terms.
7. For each trip, the system revalidates availability and conflicts.
8. Driver confirms the individual trip by the trip-specific cutoff.
9. If the driver declines, does not acknowledge, reports sickness, or the vehicle fails, the trip enters `REPLACEMENT_REQUIRED`.
10. Dispatch searches eligible backups using constraints: category, vehicle, location, timing, capacity, verification, and service area.
11. The system reserves a candidate temporarily to avoid double assignment.
12. Candidate accepts the trip; final validation runs again.
13. If valid, assignment becomes `CONFIRMED`, the previous assignment is superseded in the audit log, and passenger is notified.
14. If no backup is accepted by the escalation deadline, dispatch staff are alerted and the passenger receives an honest status update.
15. If the service cannot be delivered, apply the documented service-failure policy: alternative with consent, reschedule, refund/credit, or cancellation.
16. Record the reason, timestamps, attempts, communication, resolution, and any compensation.

### 9.6 Replacement eligibility rules

A replacement is eligible only if all applicable constraints are met:
- Active and verified driver account.
- Required licence/credential status is valid.
- Correct service category eligibility.
- Vehicle type and capacity satisfy booking.
- Driver and vehicle are available for the entire required time window.
- No conflicting assignment or prohibited working-time overlap.
- Pickup can be reached within the service's operational limits.
- Required passenger/route/accessibility constraints are satisfied.
- Operator is authorized to provide the service in that area.

A candidate who fails one required constraint must be excluded, not treated as a lower-ranked alternative.

### 9.7 Reliability and honest guarantees

The platform may display reliability targets only when measured and operationally supported. Examples of possible commitments include:
- Assignment confirmation by a stated cutoff.
- Notification when the assignment changes.
- A defined service credit if an operator-caused failure meets stated conditions.
- A defined response time for dispatch support.

Do not claim “ride guaranteed” if the operator has no credible backup capacity or the terms exclude the most likely failure cases. The interface must distinguish a service target from a contractual guarantee.

### 9.8 Driver income and operator economics

The recurring plan may help drivers and operators plan work more predictably. However:
- A passenger's subscription payment is not automatically the driver's income.
- Platform fee, operator revenue, driver compensation, taxes, fuel/charging, waiting, dead mileage, cancellation compensation, and maintenance are separate accounting concepts.
- The operator agreement must define driver payment timing, per-trip or fixed compensation, minimums if any, cancellations, standby duty, and substitute-driver payment.
- Marketing must not promise guaranteed monthly driver income unless the contract supports that promise.
- A substitute driver must be paid according to the applicable operator policy; replacement work must not become unpaid labour by default.

### 9.9 Plan changes, pauses, leave, and renewals

- Passenger may request a schedule change; it takes effect only after capacity and price revalidation.
- Passenger may mark leave dates within plan limits. The app must show whether leave creates credit, no refund, or a rescheduled trip.
- Operator may block maintenance/holiday dates only under disclosed plan rules.
- Renewal reminder and renewal amount must be disclosed before charge.
- Price changes must not silently alter an already-paid period.
- A route or category change can require a new capacity review.
- Pausing a plan must state start/end dates, effect on billing, and whether recurring assignments are released.
- A plan cannot be paused retroactively to erase a completed or dispatched trip unless policy explicitly allows it.
- If an operator exits the service area or loses capacity, notify affected passengers, stop new renewals where necessary, and provide the agreed recovery/refund process.

---

## 10. Shared Ride Matching and Operations

### 10.1 Matching inputs

- Pickup and drop-off coordinates or approved place IDs.
- Desired pickup window and arrival deadline.
- Route overlap and detour tolerance.
- Vehicle capacity and passenger count.
- Service category and driver eligibility.
- Individual/shared preference.
- Fare rules and cost allocation.
- Existing bookings and dispatch lock time.
- Accessibility or other supported constraints.
- Passenger opt-out/block rules, where implemented.

### 10.2 Matching workflow

1. Passenger opts into shared rides.
2. System finds candidate trips within a configured time and route window.
3. Candidate is rejected if any mandatory constraint fails.
4. System estimates pickup/drop-off order, detour, capacity, and price.
5. System presents the proposed shared itinerary and price to affected passengers before final lock, where changes are material.
6. Required passengers consent to the match and any disclosed price/time change.
7. Operator confirms vehicle capacity and assignment.
8. Trip enters `SHARED_MATCH_LOCKED`.
9. New passengers cannot be inserted after lock without revalidation and any required passenger consent.
10. If a passenger cancels, the system recalculates remaining trip feasibility and price.
11. If the match becomes invalid, dispatch offers a compliant alternative, an individual ride if supply and price are accepted, rescheduling, or refund according to policy.

### 10.3 Matching edge cases

- **No match found:** honour the passenger's shared preference setting. If shared is only preferred, offer individual service only if available and clearly priced; if shared is required, offer waitlist/reschedule/cancel.
- **Passenger cancels before lock:** rematch without penalizing remaining passengers for a platform-caused change.
- **Passenger cancels after lock:** apply disclosed cancellation terms and recalculate only according to transparent policy.
- **Capacity exceeded:** reject the match; never assume a child, bag, or extra passenger can be accommodated outside vehicle limits.
- **Route detour exceeds maximum:** do not match.
- **Pickup time windows conflict:** do not match unless all affected passengers accept the new schedule.
- **Women-Only match has an ineligible passenger:** reject the match.
- **Driver replacement changes eligibility:** rerun all matching constraints.
- **Shared ride becomes individual due to cancellations:** disclose price and ask for consent if price changes.
- **One passenger is unreachable:** follow a defined confirmation deadline; do not hold all passengers indefinitely.
- **Passenger reports another passenger:** separate immediate safety response from ratings and ordinary customer support.

### 10.4 Pricing for shared rides

The product must define whether pricing is:
- A fixed per-passenger subscription price.
- A per-trip share of the total fare.
- A route/zone-based fixed amount.
- A hybrid plan with disclosed included trips and extra-trip pricing.

The MVP should avoid opaque “dynamic” price changes. Any price recalculation must show the reason and require consent when the passenger's agreed amount or terms materially change.

---

## 11. Women-Only Service: Policy and Safety Invariants

Women-Only is a product-level constraint, not a marketing label.

### 11.1 Required behaviour
- Category selection is explicit and visible during plan creation and booking.
- Eligibility requirements are explained before purchase.
- Only eligible passengers are included in Women-Only shared rides.
- Driver eligibility must match the actual policy advertised to the passenger.
- Replacement search uses the same category constraints as the original booking.
- Category remains visible in operator dispatch tools and driver trip manifests where needed.
- Category changes require explicit passenger action and confirmation.
- If no eligible supply exists, show the limitation and available next steps.
- The system logs every attempted category change and who initiated it.

### 11.2 Never do the following
- Never silently convert Women-Only to Standard.
- Never assign a driver who fails the configured eligibility rules.
- Never add an ineligible passenger to a shared ride.
- Never imply that a category alone guarantees personal safety.
- Never expose sensitive verification documents to other passengers or drivers.

### 11.3 If a Women-Only trip cannot be served
1. Search eligible replacement resources.
2. Escalate to dispatch before the passenger's decision deadline.
3. Notify the passenger with a clear explanation and next update time.
4. Offer only valid options: wait for an eligible replacement, reschedule, cancel/refund/credit under policy, or explicitly switch category if the passenger chooses and an alternative is available.
5. Record the failure reason for operator performance analysis.
6. Do not penalize the passenger for refusing an ineligible substitution.

### 11.4 Safety response
- Provide a clear emergency/help entry point during active trips.
- Route urgent reports to trained support according to the operating model.
- Explain that the app is not a replacement for local emergency services.
- Allow post-trip incident reports even if the passenger does not submit a star rating.
- Restrict incident evidence to authorized personnel and log access.
- Define retention, escalation, law-enforcement response, and appeal processes with legal and safety specialists before launch.

---

## 12. Ratings, Reviews, and Passenger-to-Passenger Feedback

### 12.1 Driver ratings

Passengers may rate a driver only after a valid completed trip or a policy-defined eligible service event. The rating must be tied to the correct trip and driver assignment. A cancelled trip must not create a normal completed-trip rating opportunity.

### 12.2 Passenger-to-passenger ratings

For a shared trip with four women, each passenger may rate the other three passengers who actually shared that completed trip. The same rule applies to any other eligible shared group, subject to service policy.

**Eligibility rules:**
- Both people must be associated with the same completed shared trip.
- The rater must have completed or otherwise legitimately participated in the trip according to policy.
- One rating per rater/ratee/trip.
- No rating of someone who cancelled before joining or was never on the vehicle.
- Ratings are unavailable for an individual trip with no other passenger.
- The system must prevent duplicate submissions and fabricated trip membership.
- Ratings must not reveal private profile or contact information.
- A passenger must not be able to use a rating to reveal another passenger's identity beyond what the trip already disclosed.

### 12.3 Rating workflow

1. Trip is marked `COMPLETED`.
2. System calculates eligible rating pairs from the final trip manifest.
3. Each eligible participant receives a rating request after the trip.
4. The interface lists only eligible fellow passengers, using privacy-preserving display names or approved identifiers.
5. Rater submits a score and optional structured tags/comments.
6. System validates eligibility, duplicates, content policy, and abuse signals.
7. Feedback is stored as private-by-default unless a separate public-review policy is explicitly adopted.
8. User may report abusive feedback or appeal a moderation action.
9. Moderation handles threats, discriminatory abuse, doxxing, retaliation, spam, coercion, and irrelevant content.
10. Ratings are not the sole basis for account suspension; serious safety cases require a separate evidence-based process.

### 12.4 Anti-abuse and fairness

- Do not permit ratings before the trip completes.
- Do not permit users to rate people they did not travel with.
- Rate limits and duplicate checks must be enforced server-side.
- Avoid exposing individual rating text to the rated person in a way that enables retaliation, unless a clear reviewed policy requires it.
- Do not publish tiny-sample aggregate scores that make one rating appear definitive.
- Provide an appeal path for moderation decisions and demonstrably fraudulent ratings.
- Separate rating disputes from emergency safety reports.
- Avoid discriminatory prompts or rating categories based on protected or sensitive traits.
- Retain the minimum audit evidence needed to investigate abuse.

---

## 13. Pricing, Billing, Payments, Refunds, and Reconciliation

### 13.1 Pricing display

Before a passenger commits, show:
- Subscription period.
- Included trips/directions/days.
- Price and billing frequency.
- Taxes/fees where applicable.
- Extra-trip or overage price.
- Waiting-time and no-show rules.
- Holiday and leave treatment.
- Cancellation and refund rules.
- Shared-ride price and what happens if a match fails.
- Service-failure credits or remedies, if any.
- Renewal date and renewal price, if auto-renewal is supported.

### 13.2 Payment states

- `NOT_REQUIRED`
- `PENDING`
- `AUTHORIZED`
- `PAID`
- `PARTIALLY_REFUNDED`
- `REFUNDED`
- `FAILED`
- `RECONCILIATION_REQUIRED`

Payment status and plan status are separate. A paid transaction must not automatically imply that an operator has accepted the commute plan.

### 13.3 Payment workflow

1. Passenger reviews the final plan quote.
2. Passenger confirms payment method and authorizes the disclosed amount.
3. Payment provider returns a status.
4. Platform stores a transaction reference and idempotency key.
5. Plan activates only when the required payment and operator acceptance conditions are met.
6. Receipts are available in the passenger account.
7. Refunds are linked to the original transaction and reason.
8. Finance/support can reconcile mismatches without creating duplicate charges or refunds.

### 13.4 Payment edge cases

- Payment succeeds but callback is delayed: verify transaction status before retrying charge.
- Duplicate payment callback: idempotently process once.
- Payment fails: keep the plan pending or suspended according to policy and explain how to retry.
- Operator rejects after payment authorization: void authorization or refund according to payment-provider capability and policy.
- Subscription is partially used: calculate refund/credit only under disclosed terms.
- Trip fails due to operator/driver absence: apply service-failure remedy when conditions are met.
- Passenger cancels late: apply the exact disclosed policy; do not invent a penalty at support's discretion.
- Refund provider fails: mark `RECONCILIATION_REQUIRED`, notify support, and provide a case reference.
- Chargeback occurs: preserve the transaction and trip audit trail, limit unnecessary account actions, and follow provider rules.
- Cash or offline payment is supported: record collection and reconciliation; do not mark paid without evidence or authorized operator confirmation.

### 13.5 Financial separation

Maintain distinct ledgers or records for:
- Passenger payment.
- Platform commission/fee.
- Operator payable/revenue.
- Driver compensation.
- Taxes and other required deductions.
- Refunds and credits.
- Cancellation/no-show adjustments.
- Standby or replacement compensation, if applicable.

Do not infer driver compensation from the passenger's subscription price.

---

## 14. Cancellations, Changes, Missed Trips, and Service Recovery

### 14.1 Passenger cancellation

The interface must show cancellation deadline, fee, refund/credit treatment, and whether cancellation applies to one trip or the entire subscription. The passenger must confirm the scope before cancellation.

### 14.2 Driver/operator cancellation

1. Driver or operator selects a reason.
2. System records time and actor.
3. Trip enters `REPLACEMENT_REQUIRED`.
4. Eligible backup search starts.
5. Passenger receives an update according to urgency and communication policy.
6. Dispatch is escalated if no candidate accepts by the deadline.
7. If no compliant replacement is available, present valid options and apply the service-failure remedy.
8. Record final outcome and update reliability metrics.

### 14.3 Schedule change

- Passenger submits the requested change.
- Platform calculates fare, capacity, and matching impact.
- Operator approves if required.
- Passenger accepts material changes.
- New schedule version is saved; old version remains in audit history.
- Changes do not silently alter trips already dispatched unless explicitly confirmed.

### 14.4 Missed pickup and waiting

Define:
- Driver arrival evidence.
- Passenger notification time.
- Grace period.
- Waiting fee, if any.
- Maximum wait.
- Contact attempts.
- No-show classification.
- Exception handling for accessibility needs or network outages.
- Dispute process.

The rules must be symmetric and distinguish passenger no-show from driver/operator failure.

### 14.5 Service recovery options

Depending on circumstances and plan terms:
- Assign eligible replacement.
- Offer a new pickup time.
- Offer a compliant individual ride if shared service fails and passenger consents to the price.
- Offer rescheduling.
- Provide a service credit.
- Refund the affected trip or eligible unused portion.
- Cancel the plan if repeated service failures make the commitment unviable.
- Escalate to human support or safety operations.

Never represent an unconfirmed alternative as guaranteed.

---

## 15. Notifications and Communication

### 15.1 Events that may trigger notifications

- Account verification and security events.
- Plan request received, accepted, rejected, or waitlisted.
- Payment success/failure/refund.
- Plan activation, renewal reminder, pause, or cancellation.
- Trip reminder and assignment confirmation.
- Driver acknowledgement deadline approaching.
- Driver or vehicle reassignment.
- Driver en route and arrived.
- Pickup delay or dispatch escalation.
- Trip completion and receipt.
- Shared-ride proposal, match confirmation, itinerary/price change, or match failure.
- Safety/support case updates.
- Rating request and rating moderation outcome.
- Operator plan or fleet capacity issue.

### 15.2 Notification rules

- Use in-app notifications plus supported push/SMS/email channels as configured.
- Critical assignment changes should have a fallback channel where available.
- Avoid sending sensitive identity or safety details in lock-screen text.
- Notifications must be idempotent where possible and tied to the correct plan/trip version.
- Do not claim that a notification was delivered if the provider only accepted it for sending.
- Let users manage noncritical notification preferences without disabling essential service updates.

---

## 16. Admin, Dispatch, and Support Workflows

### 16.1 Operator onboarding

1. Business submits required details and documentation.
2. Platform reviews identity, authorization, service area, and compliance requirements.
3. Operator adds staff and assigns role permissions.
4. Operator configures fleet, vehicles, drivers, categories, schedules, prices, and service commitments.
5. Platform validates required fields and resource conflicts.
6. Operator completes a test dispatch before live subscriptions are accepted.
7. Operator is activated only after required checks pass.

### 16.2 Fleet and driver management

- Driver profile, verification status, qualifications, contact channel, availability, and operator association.
- Vehicle registration, category, capacity, documentation/inspection status, and maintenance blocks.
- Availability calendars and recurring commitments.
- Assignment history and conflict checks.
- Suspension/deactivation flow that protects already-booked passengers by triggering dispatch review.
- Expiring documents should trigger alerts and prevent invalid assignments where required.

### 16.3 Dispatch board

The dispatch board should display:
- Today's and upcoming trips.
- Plan/subscription reference.
- Service category and ride mode.
- Pickup window and route.
- Assignment status.
- Driver and vehicle.
- Driver confirmation status.
- Replacement status and attempts.
- Risk/urgency flags based on time remaining, not unsupported safety scoring.
- Passenger communication status.
- Open support/safety cases, with restricted details according to role.

### 16.4 Support case workflow

1. Case is created from passenger/driver/operator report or automated failure.
2. Case receives category, urgency, related plan/trip/payment IDs, and owner.
3. System preserves relevant events and transaction references.
4. Support verifies identity and authority before disclosing details.
5. Support follows a runbook for booking, payment, rating, or safety case.
6. Safety cases are routed to authorized safety personnel.
7. Resolution, refund/credit, and communication are recorded.
8. Case closes only after a documented outcome; reopening is possible.
9. Access and edits are audited.

### 16.5 Safety escalation

- Immediate danger: show local emergency guidance and route to trained support where available; do not imply the app itself is emergency dispatch unless it truly is.
- Alleged harassment or assault: restrict case access, preserve relevant evidence, avoid forcing a public rating, and follow reviewed escalation procedures.
- Driver misconduct allegation: use a fair process, protect passengers, prevent inappropriate retaliation, and distinguish precautionary temporary restriction from a final finding.
- False or malicious reports: investigate fairly; do not dismiss reports solely because no rating was submitted.
- Legal requests: route through an authorized process and record disclosure.

---

## 17. Functional Requirements

Priority definitions: **P0** = required for a safe, usable MVP; **P1** = important after core pilot; **P2** = later enhancement.

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-01 | P0 | Passenger authentication | Users can register, verify, sign in, recover access, and sign out securely. |
| FR-02 | P0 | Saved locations | Passenger can save, edit, and delete named pickup/destination locations. |
| FR-03 | P0 | Recurring plan creation | Passenger can configure route, days, time, direction, duration, category, vehicle, and ride mode. |
| FR-04 | P0 | Quote and terms | Full fare and plan terms are shown before request/payment. |
| FR-05 | P0 | Operator plan review | Operator can accept, reject, waitlist, or propose changes; material changes require passenger consent. |
| FR-06 | P0 | Capacity validation | Conflicting driver/vehicle assignments and impossible schedules are blocked. |
| FR-07 | P0 | Primary assignment | Operator can assign a primary driver and vehicle or a pool-based dispatch policy. |
| FR-08 | P0 | Driver acknowledgement | Driver must accept/decline assignments by configured deadlines. |
| FR-09 | P0 | Backup dispatch | Driver/vehicle failure triggers eligible backup search and escalation. |
| FR-10 | P0 | Replacement eligibility | Replacement must satisfy all mandatory category, vehicle, schedule, capacity, verification, and route constraints. |
| FR-11 | P0 | Women-Only invariant | No automatic category downgrade; invalid replacement or passenger match is rejected. |
| FR-12 | P0 | Trip lifecycle | Trip status follows valid transitions and all changes are timestamped. |
| FR-13 | P0 | Notifications | Plan, assignment, cancellation, delay, payment, and trip events notify relevant users. |
| FR-14 | P0 | Cancellation/recovery | Defined passenger/operator cancellation and service-failure rules are applied consistently. |
| FR-15 | P0 | Payment ledger | Transactions, refunds, credits, and reconciliation states are auditable and idempotent. |
| FR-16 | P0 | Subscription schedule generation | Active plans generate trip instances only for valid service dates and schedule rules. |
| FR-17 | P0 | Plan pause/leave/renewal | Supported plan changes follow published policy and are auditable. |
| FR-18 | P0 | Admin/dispatch board | Operator can view upcoming trips, assignments, unconfirmed trips, and replacement needs. |
| FR-19 | P0 | Support cases | Staff can create, assign, resolve, and audit support cases. |
| FR-20 | P0 | Safety reports | Passenger can submit a private safety report separate from rating. |
| FR-21 | P0 | Driver ratings | Rating is allowed only for an eligible completed service event. |
| FR-22 | P0 | Passenger-to-passenger ratings | Only actual participants in the same completed shared trip can rate each other, once per trip. |
| FR-23 | P0 | Privacy and access control | Role-based access prevents unauthorized viewing of passenger, payment, and safety data. |
| FR-24 | P0 | Audit history | Critical assignment, plan, payment, category, rating moderation, and support actions are recorded. |
| FR-25 | P1 | Shared-ride matching | Candidate matching respects route, time, detour, capacity, category, and consent rules. |
| FR-26 | P1 | Shared itinerary consent | Passengers see material price/time changes and consent before lock. |
| FR-27 | P1 | In-app trip messaging | Masked/controlled communication is available for active trip coordination. |
| FR-28 | P1 | Reliability analytics | Operator and platform dashboards report on-time performance, substitution success, failures, and complaints. |
| FR-29 | P1 | Service credits | Configurable service-failure credits follow transparent policy and finance reconciliation. |
| FR-30 | P1 | Driver compensation reporting | Operator can reconcile completed trips, cancellations, standby work, and compensation records. |
| FR-31 | P1 | Renewal management | Passenger receives reminders and can manage renewal consent and payment method. |
| FR-32 | P2 | Corporate/campus plans | Employer or institution can sponsor/coordinate eligible commute subscriptions. |
| FR-33 | P2 | Advanced demand forecasting | Operator receives capacity forecasts based on real historical data. |
| FR-34 | P2 | Multi-city operations | Multiple operating areas, time zones, local policy configurations, and currencies are supported. |

---

## 18. State Machines and Invariants

### 18.1 Subscription state machine

Possible states:
- `DRAFT`
- `REQUESTED`
- `PENDING_OPERATOR_CONFIRMATION`
- `WAITLISTED`
- `PENDING_PAYMENT`
- `ACTIVE`
- `PAUSED`
- `CHANGE_REQUESTED`
- `CANCELLATION_REQUESTED`
- `CANCELLED`
- `EXPIRED`
- `SUSPENDED_SERVICE_RECOVERY`

Key rules:
- `ACTIVE` requires operator acceptance and the required payment condition.
- `WAITLISTED` must not be presented as confirmed service.
- `PAUSED` stops generating trips only from the approved effective date.
- Material changes create a new schedule/terms version.
- Cancellation does not erase completed trip/payment records.
- An operator capacity failure may suspend future service while support resolves recovery; completed trips remain intact.

### 18.2 Trip state machine

Possible states:
- `SCHEDULED`
- `ASSIGNMENT_PENDING`
- `DRIVER_CONFIRMATION_PENDING`
- `CONFIRMED`
- `REPLACEMENT_REQUIRED`
- `REPLACEMENT_SEARCHING`
- `REPLACEMENT_PENDING_ACCEPTANCE`
- `DRIVER_EN_ROUTE`
- `ARRIVED`
- `IN_PROGRESS`
- `COMPLETED`
- `CANCELLED_BY_PASSENGER`
- `CANCELLED_BY_OPERATOR`
- `CANCELLED_BY_PLATFORM`
- `NO_SHOW_PASSENGER`
- `NO_SHOW_DRIVER`
- `INTERRUPTED`
- `DISPUTED`

Key rules:
- A trip cannot be `COMPLETED` without the required completion evidence or approved manual resolution.
- A cancelled trip cannot return to active state; create a replacement trip/version if policy permits.
- Every assignment change retains the old assignment in audit history.
- `REPLACEMENT_REQUIRED` must trigger an action or explicit escalation, not remain indefinitely without owner.
- `DISPUTED` may coexist as a case flag or state depending on implementation, but must not erase the actual trip outcome.
- Shared-trip state changes must be reconciled for all affected passengers.

### 18.3 Assignment state machine

- `PROPOSED`
- `OFFERED_TO_DRIVER`
- `ACCEPTED`
- `DECLINED`
- `TIMED_OUT`
- `SUPERSEDED`
- `CANCELLED`

A driver may not have overlapping accepted assignments that violate scheduling or operational constraints. A candidate reservation must expire automatically if not accepted by its deadline.

### 18.4 Non-negotiable invariants

1. No confirmed booking without a valid operator/service capacity path.
2. No assignment to an unverified or ineligible driver/vehicle.
3. No automatic category downgrade.
4. No duplicate charge/refund due to retries or duplicate callbacks.
5. No rating without valid trip membership and eligibility.
6. No silent price change after passenger consent.
7. No destructive overwrite of critical audit records.
8. No passenger penalty for refusing an ineligible replacement.
9. No unsupported claim of guaranteed backup, punctuality, or driver income.
10. No indefinite unresolved dispatch state without a visible owner, deadline, and passenger update.

---

## 19. Data Model (Logical)

The final schema is an engineering decision, but the following entities and relationships are required.

### 19.1 Core entities

**User**
- `id`
- `role_flags`
- `account_status`
- `display_name`
- `contact_reference`
- `verification_status`
- `created_at`, `updated_at`

**PassengerProfile**
- `user_id`
- optional preferences
- saved place references
- notification preferences
- accessibility/other optional requirements only where supported and consented

**Operator**
- `id`
- business identity and verification status
- service areas
- operating hours
- plan/service policies
- status

**OperatorMembership**
- `operator_id`
- `user_id`
- role and permissions
- status

**Driver**
- `user_id`
- `operator_id`
- qualification/verification references
- service category eligibility
- availability state
- suspension/expiry state

**Vehicle**
- `id`
- `operator_id`
- category, capacity, accessibility attributes if applicable
- verification/inspection status
- maintenance blocks
- availability state

**CommutePlan**
- `id`
- `passenger_id`
- `operator_id`
- route references
- schedule rule
- start/end date
- direction and ride mode
- service category
- price/terms version
- plan status
- primary assignment policy
- created/updated timestamps

**ScheduleVersion**
- `id`
- `plan_id`
- version number
- effective date range
- immutable snapshot of schedule and terms
- actor and reason for change

**Trip**
- `id`
- `plan_id` (nullable for one-time rides)
- service date
- direction
- scheduled pickup window
- actual timestamps
- trip status
- route/itinerary version
- completion evidence reference

**Assignment**
- `id`
- `trip_id`
- `driver_id`
- `vehicle_id`
- assignment role (primary, backup, final)
- assignment state
- offer/acceptance deadlines
- reason for change
- timestamps

**BackupPool**
- `id`
- `operator_id`
- eligible drivers/vehicles or rule-based membership
- service/category constraints
- operating windows

**SharedRideGroup**
- `id`
- service category
- route/itinerary version
- capacity
- lock status
- price allocation policy

**SharedRideParticipant**
- `shared_ride_group_id`
- `trip_id` or booking reference
- passenger ID
- consent state
- pickup/drop-off order
- participation status

**PaymentTransaction**
- `id`
- `passenger_id`
- plan/trip reference
- provider reference
- amount/currency
- state
- idempotency key
- timestamps

**LedgerEntry**
- `id`
- transaction reference
- account type
- amount
- reason
- reconciliation state

**RefundOrCredit**
- `id`
- original transaction
- reason and policy version
- amount
- status
- support case reference

**Rating**
- `id`
- trip ID
- rater ID
- ratee ID
- rating type (driver/passenger)
- score and optional structured feedback
- moderation status
- unique key enforcing one rating per eligible pair/trip

**SafetyReport**
- `id`
- trip/plan reference where applicable
- reporter reference
- restricted incident classification
- description/evidence references
- urgency and status
- access-control metadata
- retention/legal hold metadata

**SupportCase**
- `id`
- case type, priority, owner
- related user/plan/trip/payment IDs
- status
- resolution
- audit timestamps

**Notification**
- `id`
- recipient
- event type
- entity/version reference
- channel
- provider status
- sent/delivered status where known
- retry metadata

**AuditEvent**
- `id`
- actor and role
- action
- entity type/ID
- before/after summary or secure reference
- reason
- timestamp
- correlation/request ID

### 19.2 Data integrity requirements

- Use stable identifiers and foreign-key integrity where supported.
- Enforce idempotency for payment and dispatch callbacks.
- Enforce uniqueness for ratings per rater/ratee/trip.
- Store schedule and fare versions so historical trips retain the terms under which they were booked.
- Keep audit events append-only for critical actions.
- Avoid storing raw identity documents longer than necessary; use secure references and a retention policy.
- Separate sensitive safety data from ordinary support and rating data.
- Use UTC timestamps in storage and render local time using the service location's time zone.
- Store currency explicitly; do not assume one currency in the data model.
- Avoid using a driver's or passenger's display name as a unique key.

---

## 20. Technical Architecture (Suggested, Not Mandated)

### 20.1 Logical components

- Passenger web/mobile client.
- Driver client or responsive driver portal.
- Operator dispatch dashboard.
- Admin/support console.
- Authentication and role-based access service.
- Plan and schedule service.
- Capacity and assignment service.
- Shared-ride matching service.
- Notification service.
- Payment integration and ledger service.
- Ratings and moderation service.
- Safety case workflow.
- Analytics and audit pipeline.
- Maps/geocoding/routing provider integration.

### 20.2 Architecture principles

- Keep pricing, category eligibility, capacity validation, and payment state on the server.
- Treat clients as untrusted; validate all status transitions server-side.
- Use a job queue or equivalent reliable scheduler for recurring trip generation, reminders, and dispatch deadlines.
- Make event processing idempotent.
- Use transactional or carefully coordinated updates when assigning a driver/vehicle to prevent double booking.
- Use explicit time zones and daylight-saving-safe schedule logic.
- Make external provider failures recoverable; maps, notifications, and payments may be unavailable temporarily.
- Maintain audit events for high-impact changes.
- Add monitoring and alerting for stuck dispatch jobs, payment reconciliation, and missed notification events.

### 20.3 Suggested technology-neutral APIs

Representative endpoints/actions:
- `POST /auth/register`
- `POST /auth/verify`
- `GET /service-areas`
- `POST /commute-plans/quote`
- `POST /commute-plans`
- `GET /commute-plans/{id}`
- `POST /commute-plans/{id}/change-requests`
- `POST /commute-plans/{id}/pause`
- `POST /commute-plans/{id}/cancel`
- `GET /trips`
- `GET /trips/{id}`
- `POST /trips/{id}/assignment-confirmation`
- `POST /trips/{id}/report-unavailability`
- `POST /trips/{id}/replacement-candidates`
- `POST /trips/{id}/accept-replacement`
- `POST /trips/{id}/status`
- `POST /trips/{id}/complete`
- `POST /shared-rides/match-preview`
- `POST /shared-rides/{id}/consent`
- `POST /payments/checkout`
- `POST /payments/webhooks/{provider}`
- `POST /payments/{id}/refund-request`
- `POST /trips/{id}/ratings`
- `POST /trips/{id}/safety-reports`
- `POST /support/cases`

These are illustrative contracts, not a final API specification. Every endpoint must define authorization, validation, idempotency, errors, rate limits, and audit behaviour.

---

## 21. Security, Privacy, and Compliance

### 21.1 Security requirements

- Secure authentication and session handling.
- Role-based and resource-level authorization.
- Encryption in transit and appropriate encryption at rest.
- Secret management; no API keys or payment secrets in client bundles or source control.
- Rate limits for authentication, booking, ratings, reports, and support endpoints.
- Input validation and output encoding.
- Protection against IDOR/BOLA access to other users' trips, payments, ratings, or reports.
- Secure webhook verification and replay protection.
- Audit logs for privileged actions.
- Least-privilege access for support and operators.
- Incident response and credential revocation process.
- Backup and recovery testing.

### 21.2 Privacy requirements

- Explain location collection and when trip location is shared.
- Share live location only for a legitimate trip purpose and only with authorized parties.
- Do not expose a passenger's home address to other shared passengers by default.
- Use masked contact or controlled messaging where possible.
- Keep Women-Only eligibility verification data restricted.
- Keep safety reports separate from ratings and public profiles.
- Define retention/deletion policies for account data, location traces, payments, ratings, and incident evidence.
- Provide account data access and deletion workflows subject to legal retention obligations.
- Do not use sensitive attributes for unrelated ranking, advertising, or profiling.
- Obtain consent for optional analytics or precise tracking where required.

### 21.3 Compliance work before launch

Obtain qualified legal/operational review for the launch jurisdiction, including as applicable:
- Transport operator and vehicle permits.
- Driver licensing and background/identity verification.
- Commercial passenger transport and insurance.
- Consumer protection, subscription renewals, cancellation and refund disclosures.
- Payment-provider and tax obligations.
- Data protection, location privacy, retention, and breach response.
- Women-only service eligibility and non-discrimination requirements.
- Worker classification and driver compensation.
- Accessibility and safety incident handling.
- Required records and lawful disclosure process.

This PRD does not itself establish compliance. Launch must be blocked until required local reviews and approvals are complete.

---

## 22. Non-Functional Requirements

### 22.1 Reliability and availability
- Core plan/trip state must be durable and recoverable.
- Failed background jobs must retry safely and alert when stuck.
- Payment and assignment processing must be idempotent.
- The system should define service availability targets before production launch.
- Critical trip status should remain viewable during partial provider outages where possible.

### 22.2 Performance
Initial targets to validate in pilot:
- Common passenger screens should load within an agreed latency budget under typical mobile conditions.
- Quote requests should return promptly or show a clear processing state.
- Dispatch board should support filtering by date, operator, assignment state, and urgency.
- Large fleet operations should use pagination and server-side filtering.

Do not promise numeric performance targets until load assumptions and hosting architecture are validated.

### 22.3 Accessibility and usability
- Clear language and readable contrast.
- Screen-reader labels for core controls.
- Large touch targets and low-friction trip status display.
- Error messages that explain what happened and what to do next.
- Support for relevant local languages based on launch market.
- Avoid relying on colour alone to communicate booking or safety status.

### 22.4 Observability
Monitor:
- Trip generation failures.
- Unconfirmed driver assignments.
- Replacement search duration and failure.
- Conflicting assignment attempts.
- Notification failure.
- Payment callback/reconciliation backlog.
- Plan activation errors.
- Shared-match invalidation.
- Safety case response time.
- API errors and latency.

---

## 23. Analytics and Success Metrics

Metrics must be defined precisely, segmented responsibly, and reviewed for unintended incentives.

### 23.1 Passenger value
- Plan request-to-activation conversion.
- Percentage of recurring trips completed.
- On-time pickup rate against the published window.
- Passenger-reported effort/satisfaction.
- Repeat subscription and renewal rate.
- Cancellation rate by cause.
- Rate of successful service recovery after a failure.

### 23.2 Dispatch reliability
- Percentage of trips assigned before the cutoff.
- Driver acknowledgement rate.
- Replacement success rate.
- Median and 90th-percentile time to confirm a replacement.
- Driver no-show and operator cancellation rates.
- Percentage of replacement trips meeting all eligibility constraints.
- Number of unresolved trips at pickup cutoff.
- Service failures per 1,000 scheduled trips.

### 23.3 Operator economics
- Fleet utilization by time window.
- Driver/vehicle conflict rate.
- Cost per completed trip.
- Subscription contribution margin.
- Dead mileage and standby burden.
- Refund/credit cost.
- Driver compensation accuracy and timeliness.
- Capacity rejected due to insufficient backup supply.

### 23.4 Shared rides
- Match offer acceptance rate.
- Completed shared-trip rate.
- Average detour versus the agreed maximum.
- Shared-trip cancellation rate.
- Cost savings versus comparable individual trips, only where measured fairly.
- Incidents or complaints per 1,000 shared trips.

### 23.5 Safety and trust
- Report acknowledgement and resolution time.
- Repeated complaints by operator/driver, reviewed with due process.
- Ratings moderation rate and appeal outcomes.
- Women-Only category violation count; target is zero.
- Invalid driver/vehicle assignment count; target is zero.
- Privacy/access-control incidents; target is zero.

### 23.6 Metric cautions
- Do not optimize on-time rate by hiding late trips or redefining pickup windows after the fact.
- Do not optimize ratings by pressuring passengers to give high scores.
- Do not treat low report volume as proof of safety.
- Do not compare operators without considering route, time, service category, and sample size.
- Establish baselines during the pilot before setting aggressive numerical targets.

---

## 24. Edge-Case Catalogue and Expected Behaviour

| Situation | Required system behaviour |
|---|---|
| Primary driver X is sick | Mark assignment unavailable; start eligible backup search; notify passenger when the status changes. |
| Backup driver Y is already assigned elsewhere | Exclude Y if assignments conflict; do not double-book. |
| No backup driver is available | Escalate to dispatch; notify passenger by cutoff; offer only feasible alternatives or refund/credit under policy. |
| Backup exists but is not eligible for Women-Only | Exclude backup; never downgrade automatically. |
| Replacement vehicle has fewer seats | Reject if it cannot accommodate the booking/shared group. |
| Vehicle breaks down during a trip | Mark trip interrupted; prioritize passenger safety; dispatch a compliant replacement or agreed safe resolution. |
| Driver has expired required documents | Block assignment where the document is required; alert operator. |
| Operator accepts only some recurring days | Show exact coverage and require passenger consent to a partial plan. |
| Student has an exam/holiday | Apply published leave/holiday policy; do not assume every academic holiday is known. |
| Professional works overtime | Allow one-time change/request if capacity supports it; disclose extra charge and confirmation status. |
| Passenger changes pickup point | Recalculate serviceability, price, and schedule; require consent if material. |
| Passenger requests a new driver permanently | Treat as a preference/change request, not an entitlement; check capacity and communicate outcome. |
| Passenger wants the same driver every day | Support a primary-driver preference where feasible, but disclose that eligible replacements may be needed. |
| Passenger refuses a replacement | Do not penalize refusal of an ineligible or materially different replacement; apply the plan's disclosed cancellation/recovery rules. |
| Shared match cannot be found | Follow shared preference: offer compliant alternative only with consent, waitlist, reschedule, or refund. |
| Shared passenger cancels | Recalculate capacity, itinerary, and pricing; notify remaining passengers of material changes. |
| Ineligible passenger enters Women-Only shared trip | Prevent confirmation; if discovered after lock, escalate and resolve without exposing private eligibility details. |
| One shared passenger reports another | Open a restricted safety/support case; do not expose report to the reported passenger. |
| Passenger submits duplicate rating | Reject duplicate server-side and show existing submission status. |
| Passenger tries to rate someone from a different trip | Reject because trip membership does not match. |
| Rating contains threat or personal information | Restrict/hide according to moderation policy and offer reporting/appeal. |
| Passenger makes safety report without rating | Accept the report; ratings are optional and separate. |
| Payment succeeds but plan fails to activate | Reconcile transaction; reverse/refund according to policy; do not charge again automatically. |
| Payment webhook is delivered twice | Process once using idempotency/provider transaction ID. |
| Refund provider is unavailable | Mark reconciliation required, notify support, and keep a traceable case. |
| Push notification fails | Retry/fallback according to policy; keep authoritative status in app/server. |
| Driver and passenger dispute no-show | Preserve timestamps/contact attempts and route to review; avoid automatic irreversible penalty without evidence. |
| User deletes account with an active subscription | Explain cancellation/settlement steps and required record retention; do not silently abandon active trips. |
| Operator suspends service suddenly | Stop new commitments, notify impacted passengers, trigger recovery/refund process, and retain audit history. |
| Weather/road closure makes route unsafe or impossible | Operator may pause/cancel under defined emergency policy; communicate promptly and apply the disclosed remedy. |
| System cannot determine location | Use manual confirmation or dispatcher support; never invent a location or ETA. |
| Driver accepts two assignments due to race condition | Server-side reservation/transaction must reject one; alert dispatch if already committed. |
| Schedule crosses midnight or time-zone change | Generate trips using service-local time and explicit time-zone rules; prevent duplicate/missing trips. |
| Subscription is renewed at a changed price | Show new price and obtain required consent before charging. |
| Operator offers a different vehicle category | Require passenger consent if material; do not charge an undisclosed upgrade fee. |
| Passenger is unreachable before a shared-match lock | Follow a stated timeout; do not hold others indefinitely; notify affected participants. |
| Rating is retaliatory after a safety report | Apply moderation and restricted review; do not reveal the report or reporter's private information. |
| Driver compensation is disputed | Keep trip/assignment/compensation records and provide a separate review path. |
| Driver's app goes offline | Dispatch can use controlled manual status updates; audit the actor and timestamp. |
| Plan has no service on a public holiday | Follow the plan's explicit calendar and show the exception before purchase and in reminders. |

---

## 25. User Interface / Screen Inventory

### 25.1 Passenger experience
1. Welcome, sign-in, verification.
2. Home/dashboard with upcoming commute and status.
3. Saved places.
4. Create commute plan wizard.
5. Service category and ride mode selection.
6. Plan options and transparent fare breakdown.
7. Plan request and operator-confirmation status.
8. Active subscription details and schedule calendar.
9. Trip details and live/last-known status.
10. Driver/vehicle assignment and replacement status.
11. Shared itinerary review and consent.
12. Payment methods, receipts, refund status.
13. Change, pause, leave-date, renew, and cancel flows.
14. Post-trip rating flow.
15. Safety/report flow.
16. Support case list and case detail.
17. Notification and privacy settings.

### 25.2 Driver experience
1. Account and verification status.
2. Availability and schedule.
3. Assignment offer with accept/decline.
4. Daily trip manifest.
5. Pickup and trip status controls.
6. Report unavailability/breakdown/delay.
7. Navigation handoff and masked passenger contact.
8. Completion and issue reporting.
9. Trip/compensation history.
10. Dispute/support request.

### 25.3 Operator experience
1. Operator onboarding and verification.
2. Fleet overview.
3. Driver roster and availability.
4. Vehicle roster and maintenance blocks.
5. Service area, operating hours, category, and pricing setup.
6. Subscription request queue.
7. Capacity/conflict review.
8. Recurring assignment configuration.
9. Dispatch board and replacement queue.
10. Shared-ride review.
11. Passenger communication history.
12. Cancellations, service credits, and refunds.
13. Driver compensation reconciliation.
14. Reliability analytics.
15. Staff roles and audit log.

### 25.4 Admin/support experience
1. Operator approval and compliance status.
2. User/account review.
3. Trip search and immutable timeline.
4. Payment/refund reconciliation.
5. Support case management.
6. Restricted safety incident console.
7. Rating moderation and appeals.
8. Service health and background-job monitoring.
9. Policy configuration with versioning.
10. Audit log viewer.

---

## 26. Product Copy and Communication Rules

The product should use clear, operationally accurate wording.

**Good examples**
- “Your plan is awaiting operator confirmation.”
- “Your primary driver is unavailable. We are checking eligible replacements.”
- “A replacement driver is confirmed.”
- “We could not confirm an eligible replacement by the promised cutoff. Choose reschedule or cancellation options.”
- “This is a Women-Only booking. The service category will not change unless you explicitly choose to change it.”
- “Shared ride available: review the proposed pickup window, detour, and price before confirming.”
- “Your plan provides recurring service on the dates shown, subject to the listed holiday and cancellation rules.”

**Avoid**
- “Guaranteed ride” when no contractual service guarantee exists.
- “Same driver every day” when backup substitutions are allowed.
- “Guaranteed monthly income” without a contractual minimum.
- “100% safe.”
- “Your driver is 2 minutes away” without reliable current location/ETA data.
- “Refund processed” when only a request has been created.
- “Women-only confirmed” before the required passenger and driver eligibility checks are complete.

---

## 27. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Insufficient backup fleet | Subscription promise fails | Capacity gate, minimum backup planning, transparent guarantee level, pilot route limits. |
| Overbooking driver/vehicle | Late or missed trips | Server-side conflict detection, temporary reservations, atomic assignment, dispatch alerts. |
| Women-Only supply shortage | Passenger stranded or category violation | Dedicated eligible supply planning, no silent downgrade, clear cutoff and recovery options. |
| Low shared-ride density | Poor match rate | Launch on dense corridors/time windows; make shared rides optional; measure before expansion. |
| Price ambiguity | Disputes and churn | Show complete terms before purchase; version plan terms; require consent for changes. |
| Operator failure or exit | Multiple subscriptions disrupted | Operator monitoring, service-area limits, contingency process, refunds, staged growth. |
| Driver compensation disputes | Driver attrition and legal exposure | Written operator agreements and auditable compensation records. |
| Safety incidents | Physical harm and trust loss | Verified supply, clear escalation, restricted incident workflow, emergency guidance, reviewed procedures. |
| Rating abuse/retaliation | Unfair account harm | Verified trip membership, moderation, appeal, privacy controls, separate safety process. |
| Payment mismatch | Duplicate charge or delayed refund | Idempotency, provider verification, ledger, reconciliation queue. |
| Notification failure | Passenger misses assignment changes | In-app authoritative state, retries, alternate channels for critical updates. |
| Overstated reliability marketing | Consumer trust/legal risk | Evidence-based claims, service-level definitions, measured reporting. |
| Excessive location data | Privacy risk | Minimize collection, limit sharing, retention controls, access logs. |
| Legal/regulatory uncertainty | Launch blocked or liabilities | Jurisdiction-specific review before accepting paid rides. |
| Seasonal student demand | Unused capacity or revenue fluctuation | Academic-term plans, explicit holiday calendar, flexible operator capacity. |
| Demand spikes during rain/events | Fleet shortages | Capacity caps, advance warnings, clear no-capacity handling, no unsupported guarantee. |

---

## 28. MVP Delivery Plan

### Phase 0 — Operational and legal validation
- Select one pilot geography/corridor and service type.
- Validate operator and driver supply.
- Define service category and Women-Only policy.
- Finalize fare, refund, cancellation, leave, holiday, and waiting rules.
- Review licensing, insurance, data privacy, and payments.
- Define backup capacity and what the operator can genuinely commit to.
- Run interviews with students, working professionals, women passengers, drivers, and operators.

**Exit gate:** Do not take paid subscriptions until operating model, supply, legal requirements, and recovery terms are reviewed.

### Phase 1 — Core recurring commute
- Passenger onboarding and saved places.
- Commute plan creation and quote.
- Operator plan acceptance and capacity review.
- Subscription schedule generation.
- Primary driver/vehicle assignment.
- Driver confirmation and trip lifecycle.
- Backup dispatch and passenger notifications.
- Cancellation and service recovery.
- Basic payments/receipts or a controlled pilot payment process.
- Audit trail and support cases.

**Exit gate:** Test primary and backup assignment failures, payment mismatches, and category enforcement before live pilot.

### Phase 2 — Safety and trust
- Women-Only category enforcement.
- Driver/vehicle eligibility checks.
- Private safety reporting and escalation.
- Driver ratings and passenger-to-passenger rating eligibility.
- Rating moderation and appeal.
- Privacy controls and restricted support access.

**Exit gate:** Safety and privacy review; zero known category-downgrade paths in automated and manual workflows.

### Phase 3 — Shared rides
- Match preview.
- Route/time/capacity eligibility.
- Passenger consent and shared itinerary lock.
- Shared-trip cancellation and recalculation.
- Passenger-to-passenger ratings based on actual trip membership.
- Shared-ride reliability and detour analytics.

**Exit gate:** Simulate cancellations, substitutions, ineligible passengers, capacity changes, and fare changes.

### Phase 4 — Scale and optimization
- Advanced operator capacity planning.
- Renewals and corporate/campus plans.
- Demand forecasting and fleet analytics.
- Multi-city configuration.
- Further payment and accounting automation.

---

## 29. Testing Strategy and Acceptance Scenarios

### 29.1 Required test layers
- Unit tests for schedule generation, pricing, eligibility, and state transitions.
- Integration tests for payments, notifications, mapping, and dispatch.
- Concurrency tests for driver/vehicle assignment.
- End-to-end tests for each persona workflow.
- Security tests for role access and object-level authorization.
- Accessibility and low-bandwidth tests.
- Operator simulation for absence, breakdown, and peak demand.
- Manual review of safety-report and rating-moderation workflows.

### 29.2 Mandatory end-to-end scenarios

1. Student creates a five-day monthly plan; operator accepts; trips are generated correctly.
2. Professional creates a six-day plan with a return trip; outbound and return assignments do not conflict.
3. Woman creates a Women-Only plan; eligible primary driver is assigned; passenger receives correct status.
4. Women-Only primary driver cancels; eligible backup is assigned and confirmed.
5. Women-Only primary driver cancels; only ineligible backups are available; none is assigned and the passenger is offered valid recovery choices.
6. Operator has no capacity for two requested days; partial coverage is disclosed and requires consent.
7. Driver accepts a trip and later reports a breakdown; replacement workflow starts.
8. Two dispatchers attempt to assign the same driver simultaneously; only one valid assignment succeeds.
9. Shared ride has four passengers; each eligible participant can rate the other three after completion, but no outside user can rate them.
10. One shared passenger cancels; route/capacity/price are recalculated and affected passengers are informed.
11. Payment provider sends duplicate success callbacks; only one payment is recorded.
12. Payment succeeds but operator rejects the plan; reconciliation/refund path works.
13. Passenger reports a safety issue but submits no rating; report is still accepted and restricted.
14. Driver is late and passenger is incorrectly marked as no-show; dispute process preserves evidence.
15. Notification provider fails; trip state remains correct and critical notification retry/fallback is triggered.
16. Passenger changes route after activation; plan version updates only after capacity review and consent.
17. Public holiday is excluded from a plan; no trip is generated and the exclusion was disclosed.
18. Account deletion is requested while future trips exist; the system prevents silent abandonment and follows the disclosed process.
19. A vehicle document expires before a scheduled trip; invalid assignment is blocked and dispatch is alerted.
20. No backup is found before the service cutoff; escalation, passenger update, and service-failure remedy are completed.

### 29.3 Definition of Done for MVP

- All P0 requirements implemented and tested.
- No known path silently downgrades Women-Only to Standard.
- No known path assigns an ineligible or double-booked driver/vehicle.
- Subscription and trip state machines have tested transitions and error recovery.
- Payments and refunds are idempotent and auditable.
- Driver absence and vehicle breakdown trigger a bounded replacement/escalation workflow.
- Passenger can see whether a plan or trip is confirmed, pending, cancelled, or being recovered.
- Shared passenger ratings are restricted to actual completed-trip participants.
- Safety reports are private, separately handled, and auditable.
- Operator capacity review exists before subscription activation.
- Cancellation, leave, holiday, waiting, and refund terms are disclosed before purchase.
- Support staff can investigate a trip from its immutable event timeline.
- Legal, insurance, privacy, and operating-model launch checks are signed off by the responsible parties.
- Pilot metrics and incident review cadence are established.

---

## 30. Open Decisions to Resolve Before Implementation

These decisions should be made explicitly rather than left to developer assumptions.

1. **Initial market and operating model:** Which geography and operator type will be used for the first pilot?
2. **Vehicle scope:** Auto-rickshaw, cab, other vehicle, or more than one?
3. **Service guarantee:** Is the operator committing to a defined backup response, and what remedy applies if it fails?
4. **Driver eligibility:** What exact checks are required, who verifies them, and how are expiry/suspension handled?
5. **Women-Only policy:** Is the driver required to be a verified woman for every Women-Only trip? What is the legally reviewed eligibility and verification process?
6. **Subscription billing:** Prepaid monthly, per-trip settlement, recurring billing, or hybrid?
7. **Plan coverage:** How are public holidays, student vacations, passenger leave, operator holidays, and unused trips treated?
8. **Cancellation rules:** What are the cutoffs, fees, refunds, credits, and exceptions for each party?
9. **Shared ride pricing:** Fixed passenger share, route-based price, or subscription bundle?
10. **Driver compensation:** Per trip, fixed recurring contract, standby compensation, and replacement payment?
11. **Support availability:** What hours and channels are available for urgent dispatch issues?
12. **Passenger verification:** What is required for adult passengers, students, and Women-Only eligibility?
13. **Ratings visibility:** Are ratings private, aggregated, or public? What is the appeal process?
14. **Safety operations:** Who receives reports, how quickly, what are escalation paths, and what evidence can be retained?
15. **Technology choices:** Which map, payment, messaging, hosting, and identity providers are suitable for the pilot?
16. **Success thresholds:** What minimum replacement success, on-time pickup, completion, and renewal rates justify expanding the pilot?
17. **Regulatory review:** Which local permits, insurance, consumer-protection, privacy, and payment requirements apply?
18. **Language and accessibility:** Which languages and accessibility features are required for the initial user group?

---

## 31. Glossary

- **Commute plan / subscription:** A recurring agreement for defined transport service over a period.
- **Trip instance:** One specific scheduled journey generated from a recurring plan.
- **Primary driver:** The operator's default intended driver for a recurring schedule; not necessarily the only driver.
- **Backup driver:** A qualified driver who may cover a trip when the primary assignment fails.
- **Operator/fleet:** The business or organization responsible for supplying and dispatching drivers/vehicles.
- **Replacement assignment:** A new assignment created after the original driver or vehicle becomes unavailable.
- **Women-Only:** A distinct service category whose eligibility constraints must remain enforced during matching and substitution.
- **Shared ride:** A journey in which separate passenger parties share a vehicle for compatible portions of a route.
- **Dispatch cutoff:** The defined deadline by which an assignment should be confirmed or escalated.
- **Service credit:** A monetary or ride credit granted under disclosed terms after an eligible service failure.
- **Service-level commitment:** A measurable, operationally supported or contractual promise about service behaviour.
- **Trip membership:** Verified evidence that a person was an eligible participant in a particular shared trip.
- **Audit event:** An append-only record of a consequential action, status change, or privileged access.

---

## 32. Final Product Summary

CommuteSaathi is not merely a cab-booking interface and not simply a monthly driver hire marketplace. It is a **recurring commute coordination and fleet-backed reliability platform**.

The passenger defines the commute and service preferences once. The operator accepts only service it can reasonably support, assigns primary resources, maintains eligible backup capacity, and handles dispatch when plans change. The passenger receives clear assignment status, honest communication, and a defined recovery path rather than being left to find another ride alone.

The student use case prioritizes predictable college travel and affordability. The woman passenger use case prioritizes dependable service and strict Women-Only category enforcement. The working professional use case prioritizes time, repeatability, transparent fares, and lower daily coordination effort. Individual rides and shared rides fit into the same service framework, while ratings, payments, privacy, and safety workflows remain governed by explicit rules.

The product's central operating principle is: **sell a clearly defined commute service, validate the fleet capacity needed to deliver it, and treat backup dispatch and service recovery as core functionality—not as optional support features.**
