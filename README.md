# LIVE DEPLOYMENT LINK
[CLICK TO GO TO PORTAL KIT]()

### Important :
CSS of every page is done by AI. 

# DAY 1 
For the database schema and auth i use `better auth` and make most of the files and setup the folders from that website before starting of the actual project 

# DAY 2

By setting the project and files according to the better auth instructions, i run the command by which `authschema.ts`generates automatically and it generates the important tables like `organization , members  etc` 

# DAY 3

For day 3 , i made the projects ,tasks and files pg table in the `schema.ts` and then run the command drizzle kit generate to generate and then migrate the table so that it creates its connection with the neon. After generating all the tables and connect them with neon , i make the `action.ts` file that consist of all the important actions  which takes the dynamic parameters from the different users and then that actual function in action.ts is connected to any form which is appeared on the `dashboardclient.ts`. This day also consist of file storage so i use the `neon object storage` to store the files.

# DAY 4 (STRIPE BILLING)

This is the most difficult part of the entire project which takes more than one week. I make the complete integrations of the stripe api key which i did not have so i use the test api key but to update the database i have to use webhook api key which i also did not have so i use the `searchparams` to search from the url and then if `billing?checkout==success` then updates the plans in the database.

# DAY 5 : 
I work on the logic building of admin analytics which is so far identical to making activity logs , audit logs and emails . The problem i faced in resend is to add the domain and to verify it .

# DAY 6 and DAY 7 :
I tested the whole application , deploy it , check the security fixes and also test it with multiple demo accounts and to check that all accounts comments and all the activity logs in the neon editor.  

# PROBLEMS I FACED:

- problem in storing the files so i preferred to use the `neon object storage` 
- Stripe billing is the most difficult part in order of where to find the api keys and webhook api key to update the plans in the database .
- IN the email resend api , i faced the problem in the setting the domain and verify it. 

# ARCHITECTURE NOTES: 
# Project Structure of app folder

```
app/
├── accept_invitation
│   └── page.tsx
├── api
│   ├── test
│   │   ├── email
│   │   │   └── route.ts
│   │   └── route.ts
│   └── webhooks
│       └── stripe
│           └── route.ts
├── auth
│   └── [...all]
│       └── route.ts
├── dashboard
│   ├── accept-invitation
│   │   └── page.tsx
│   ├── billing
│   │   └── page.tsx
│   ├── action.ts
│   ├── commentform.tsx
│   ├── dashboardclient.tsx
│   ├── deletebutton.tsx
│   ├── editproject.tsx
│   ├── file.tsx
│   ├── inviteform.tsx
│   ├── page.tsx
│   ├── projectform.tsx
│   ├── taskboard.tsx
│   ├── taskform.tsx
│   └── tasklist.tsx
├── emails
│   └── email.tsx
├── login
│   └── page.tsx
├── onboarding
│   └── page.tsx
├── signup
│   └── page.tsx
├── favicon.ico
├── globals.css
├── layout.tsx
├── page.tsx
└── tenant-provider.tsx
```

# Project Structure of lib folder 

```
lib/
├── data
│   ├── activity.ts
│   ├── adminanalytics.ts
│   ├── attachment.ts
│   ├── comments.ts
│   ├── members.ts
│   ├── project.ts
│   └── tasks.ts
├── stripebilling
│   ├── checkout.ts
│   ├── provider.ts
│   └── stripe.ts
├── auth-client.ts
├── auth.ts
├── billing.ts
├── invitation.ts
├── plan.ts
├── provider.ts
└── storage.ts
```







