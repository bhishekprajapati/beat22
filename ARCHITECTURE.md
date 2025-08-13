## Project Structure

The project has a turbo repo structure containing mutiple workspaces.

We have 2 workspace roots

1. `apps` - Contains public apps like `web` (next.js) app for user facing UI.

2. `services` - Contains mutiple services. These services lives inside the infra and are not meant to be exposed directly to the public.

`services` root contains to 2 services:

1. `auth`: this service handles user authentication by using jwt strategy.

2. `files`: this service handles
   file uploads for other services by using S3 buckets.

Both the services are working as intended but standalone. All 3 services are not yet wired up due to time constraints.

As I don't have any previous experience in implementing auth in microservice environment that's why i need more time to think and come up with a solution.
