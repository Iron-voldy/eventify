# Eventify Final Progress Plan And Member CRUD Breakdown

## 1. Current project state

Project:
- `Eventify` mobile event booking and management system

Core stack status:
- React Native frontend: complete
- Node.js + Express backend: complete
- MongoDB + Mongoose: complete
- JWT auth + protected routes: complete
- Multiple member-ownable modules: complete
- File upload support: now complete across the key demo modules

What was completed in this development pass:
- Fixed `frontend/src/modules/events/CreateEditEvent.js`
- Added full booking payment workflow improvements
- Added bank transfer slip upload for bookings
- Added admin payment approval / rejection for pending bank transfers
- Added optional complaint evidence image upload
- Added complaint-to-booking linking in the support flow
- Added venue image upload from the mobile admin UI
- Tightened booking and complaint ownership checks
- Fixed QR scanner to use `phoneNumber`
- Fixed the splash asset path so Expo bundling works again

Verification completed:
- Backend syntax checks passed for the changed booking and complaint files
- Expo Android export completed successfully after the splash asset fix

## 2. Safest final 6-member CRUD ownership

This is the cleanest split if the viva expects each member to own one main entity/module.

### Member 1 - Users Management Lead

Primary module:
- Users CRUD + profile management

Backend ownership:
- `backend/modules/users/User.js`
- `backend/modules/users/userController.js`
- `backend/modules/users/userRoutes.js`

Frontend ownership:
- `frontend/src/modules/users/ManageUsers.js`
- `frontend/src/modules/users/Profile.js`
- `frontend/src/modules/users/EditProfile.js`

CRUD coverage:
- Create user
- Get all users
- Get single user
- Update user
- Delete user

Extra logic:
- Block / unblock users
- Profile image upload
- Account status handling

Viva focus:
- Schema fields and validation
- Admin-only route protection
- Difference between admin user update and self profile update
- Image upload flow for profile pictures

### Member 2 - Venues CRUD Lead

Primary module:
- Venues CRUD

Backend ownership:
- `backend/modules/venues/Venue.js`
- `backend/modules/venues/venueController.js`
- `backend/modules/venues/venueRoutes.js`

Frontend ownership:
- `frontend/src/modules/venues/ManageVenues.js`
- `frontend/src/modules/venues/Venues.js`

CRUD coverage:
- Create venue
- Get all venues
- Get single venue
- Update venue
- Delete venue

Extra logic:
- Venue image upload from Expo Image Picker
- Facilities selection
- Venue-event relationship view
- Delete protection when events already use the venue

Viva focus:
- Multipart upload for `venueImage`
- Why venues are linked to events
- Validation for capacity and contact details
- Venue browse flow on the user side

### Member 3 - Events CRUD Lead

Primary module:
- Events CRUD

Backend ownership:
- `backend/modules/events/Event.js`
- `backend/modules/events/eventController.js`
- `backend/modules/events/eventRoutes.js`

Frontend ownership:
- `frontend/src/modules/events/ManageEvents.js`
- `frontend/src/modules/events/CreateEditEvent.js`
- `frontend/src/modules/events/Events.js`
- `frontend/src/modules/events/EventDetails.js`

CRUD coverage:
- Create event
- Get all events
- Get single event
- Update event
- Delete event

Extra logic:
- Event banner image upload
- Venue assignment
- Search and category filtering
- Event status handling

Viva focus:
- How multipart event creation works
- How event creation and editing were stabilized
- Validation for seats, price, and event data
- Public browse flow vs admin management flow

### Member 4 - Bookings And Payment Workflow Lead

Primary module:
- Bookings workflow CRUD

Backend ownership:
- `backend/modules/bookings/Booking.js`
- `backend/modules/bookings/bookingController.js`
- `backend/modules/bookings/bookingRoutes.js`

Frontend ownership:
- `frontend/src/modules/bookings/Checkout.js`
- `frontend/src/modules/bookings/Bookings.js`
- `frontend/src/modules/bookings/ManageBookings.js`
- `frontend/src/modules/bookings/QRScanner.js`

CRUD / workflow coverage:
- Create booking
- Read own bookings
- Read all bookings as admin
- Read single booking with ownership checks
- Cancel booking

Extra logic:
- Online payment path auto-confirms booking
- Bank transfer path uploads payment slip and creates `pending` booking
- Admin can approve or reject bank transfer payments
- QR code generation and QR scan verification
- Seat reservation and seat restoration
- Promo code application in checkout

Viva focus:
- Difference between `bookingStatus` and `paymentStatus`
- Why bank transfer stays pending until admin review
- How seat counts are reserved and restored
- Why this module is best presented as a transaction workflow, not a simple classic CRUD

### Member 5 - Reviews CRUD And Moderation Lead

Primary module:
- Reviews CRUD

Backend ownership:
- `backend/modules/reviews/Review.js`
- `backend/modules/reviews/reviewController.js`
- `backend/modules/reviews/reviewRoutes.js`

Frontend ownership:
- `frontend/src/modules/reviews/Reviews.js`
- `frontend/src/modules/reviews/ManageReviews.js`
- `frontend/src/components/ReviewCard.js`

CRUD coverage:
- Create review
- Get event reviews
- Get own reviews
- Update own review
- Delete own review

Extra logic:
- Review visibility moderation by admin
- Review allowed only after booking

Viva focus:
- Ownership checks
- Moderation logic
- Event-review relationship
- User-side review lifecycle

### Member 6 - Complaints, Upload Pipeline And Deployment Lead

Primary module:
- Complaints / support CRUD

Backend ownership:
- `backend/modules/complaints/Complaint.js`
- `backend/modules/complaints/complaintController.js`
- `backend/modules/complaints/complaintRoutes.js`
- `backend/middleware/upload.js`

Frontend ownership:
- `frontend/src/modules/complaints/Support.js`
- `frontend/src/modules/complaints/ManageComplaints.js`
- `frontend/src/constants/api.js`

CRUD coverage:
- Create complaint
- Get own complaints
- Get all complaints as admin
- Get single complaint with ownership checks
- Update complaint status / response
- Delete complaint

Extra logic:
- Optional evidence image upload
- Optional related booking selection
- Admin response / resolve / reject flow
- Upload pipeline explanation
- Deployment and environment configuration ownership

Viva focus:
- Multipart complaint upload
- Why complaint ownership checks matter
- Support workflow from user submission to admin resolution
- How backend hosting and API base URL should be prepared for final demo

## 3. Shared modules that support all members

These are important, but they should be presented as shared system infrastructure instead of one member's main CRUD entity.

Shared technical modules:
- Authentication: `authController.js`, `authRoutes.js`, `AuthContext.js`, login/register/admin login screens
- Promo codes: good extra CRUD module and checkout integration
- Dashboard analytics: strong admin bonus feature
- Wishlist: extra user engagement feature
- Error handling middleware
- JWT protection middleware

## 4. Final module readiness after this development pass

| Module | Final status | Notes |
| --- | --- | --- |
| Users | Strong | Admin CRUD + profile image flow |
| Venues | Strong | CRUD + venue image upload now wired |
| Events | Strong | Admin create/edit fixed + banner upload |
| Bookings | Strong workflow | Payment method split, slip upload, approval flow, QR scan |
| Reviews | Strong | Full user CRUD + admin moderation |
| Complaints | Strong | CRUD + evidence image + booking linkage |
| Authentication | Strong | JWT + role protection already solid |
| Promo codes | Strong bonus | Good extra CRUD + checkout validation |
| Dashboard | Bonus | Useful for demo, not a core member CRUD entity |

## 5. Important business logic now implemented

### Bookings

- Online payment creates:
  - `bookingStatus = confirmed`
  - `paymentStatus = completed`

- Bank transfer creates:
  - `bookingStatus = pending`
  - `paymentStatus = pending_verification`
  - required uploaded payment slip

- Admin bank transfer review:
  - Approve -> booking becomes confirmed
  - Reject -> booking becomes cancelled and seats are restored

- Cancel pending transfer:
  - booking becomes cancelled
  - promo usage is restored
  - seats are restored

### Complaints

- User can create complaint with:
  - subject
  - description
  - issue type
  - optional related booking
  - optional evidence image

- Admin can:
  - move to `in_progress`
  - resolve with response
  - reject
  - delete if needed

### Upload pipeline

Current uploaded image examples:
- Profile image
- Event banner image
- Venue image
- Complaint evidence image
- Booking payment slip image

## 6. Remaining work before final submission

The biggest remaining work is now mostly submission-readiness, not feature-building.

Still remaining:
- Deploy backend publicly
- Move API base URL to environment-based production config
- Move email credentials and sensitive config fully to environment variables
- Create the required report artifacts:
  - problem statement
  - system architecture diagram
  - database schema / ERD
  - API endpoint table
  - team responsibility table
- Prepare testing evidence:
  - module checklist
  - screenshots / demo proof
  - endpoint test notes

## 7. Final recommended viva strategy

Best way to present the project:
- Present 6 strong member-owned modules
- Present bookings as a workflow-heavy module, not as a simple textbook CRUD
- Emphasize file upload coverage across multiple modules
- Show that the app has both user-side and admin-side flows
- Show that validation, protected routes, and database relationships are already implemented

Best demo order:
1. Login as user
2. Browse venues and events
3. Make an online booking
4. Make a bank transfer booking with slip upload
5. Submit a complaint with evidence image
6. Login as admin
7. Approve pending booking
8. Respond to complaint
9. Show manage events / manage venues / manage users screens

## 8. Final honest assessment

This is now a strong assignment codebase.

What is already strong:
- Good feature depth
- Clear module separation
- Real file upload handling
- Strong admin + user flow coverage
- Better member ownership story

What still decides the final marks:
- Deployment proof
- Documentation quality
- Testing evidence
- How clearly each member explains their own module
