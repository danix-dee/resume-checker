import type { JobRole } from '../types/analysis';

export const JOB_ROLES: JobRole[] = [
  'Software Engineer',
  'Data Analyst',
  'Marketing',
  'Designer',
  'Other',
];

export const SAMPLE_RESUME_FILE_NAME = 'alex_rivera_swe_resume.pdf';

export const SAMPLE_RESUME_TEXT = `ALEX RIVERA
San Francisco, CA | alex.rivera@example.dev | github.com/alexrivera | linkedin.com/in/alexrivera

SUMMARY
Full-Stack Software Engineer with 4+ years of experience building scalable web applications and SaaS dashboards using TypeScript, ReactJS, Next.js, Node.js, and PostgreSQL. Proven track record reducing page load latency and shipping reliable payment and analytics workflows.

EXPERIENCE
Senior Frontend / Full-Stack Engineer — Meridian Cloud Systems (Mar 2023 – Present)
- Architected a multi-tenant analytics dashboard in ReactJS, TypeScript, and Tailwind CSS serving 45,000+ monthly active enterprise users.
- Designed and maintained RESTful and GraphQL microservices in Node.js (Express) backed by PostgreSQL and Redis caching, cutting P95 API latency from 420ms to 145ms.
- Implemented CI/CD pipelines using GitHub Actions and Docker containers deployed to AWS ECS.
- Mentored 3 junior engineers through weekly code reviews and frontend architecture RFCs.

Software Engineer — Northstar Commerce (Jun 2021 – Feb 2023)
- Built checkout and subscription billing flows using React, Redux Toolkit, and Stripe APIs, supporting $18M in annualized transaction volume.
- Wrote automated unit and integration test suites with Jest and React Testing Library, lifting frontend test coverage from 48% to 84%.
- Collaborated closely with Product and Design teams to deliver WCAG AA accessible UI components.

EDUCATION
B.S. in Computer Science — University of California, Davis (2017 – 2021)
Coursework: Data Structures, Algorithms, Distributed Systems, Database Management Systems

TECHNICAL SKILLS
Languages: TypeScript, JavaScript (ES2023), SQL, Python (basic scripting)
Frontend: ReactJS, Next.js, Tailwind CSS, HTML5, CSS3, Redux, Vite
Backend & Data: Node.js, Express, PostgreSQL, Redis, REST APIs, GraphQL
DevOps & Testing: Docker, AWS (ECS, S3), GitHub Actions, Jest, React Testing Library, Git`;

export const SAMPLE_JOB_DESCRIPTION = `Senior Full-Stack Software Engineer — FinTech Platform
Location: San Francisco, CA (Hybrid)

About the Role
We are looking for a Senior Full-Stack Software Engineer to lead development of our high-throughput treasury analytics platform and customer onboarding workflows.

Required Qualifications (Must-Have)
- 5+ years of production software engineering experience building B2B SaaS applications.
- Deep expertise in TypeScript, React.js (React 18/19), and modern state management.
- Strong backend engineering experience with Node.js and PostgreSQL (query optimization, indexing, migrations).
- Production experience with Kubernetes (K8s) and Terraform for cloud infrastructure orchestration on AWS or GCP.
- Hands-on experience designing event-driven architectures using Kafka or RabbitMQ.
- Strong automated testing discipline (unit, integration, and end-to-end testing with Playwright or Cypress).

Preferred Qualifications (Nice-to-Have)
- Experience in FinTech, payments compliance, or ledger systems.
- Familiarity with Go (Golang) or Python microservices.
- Bachelor's or Master's degree in Computer Science or equivalent practical experience.`;
