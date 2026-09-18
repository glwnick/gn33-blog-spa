import {
  Blocks,
  BookOpen,
  BrainCircuit,
  ChartColumn,
  Code2,
  Container,
  Cpu,
  Database,
  DatabaseZap,
  ExternalLink,
  FlaskConical,
  Globe,
  KeyRound,
  Languages,
  Layers,
  Leaf,
  Mail,
  Rocket,
  Route,
  Server,
  ShieldCheck,
  Store,
  Table2,
  TableProperties,
  UserRound,
  Wind,
  Zap,
} from 'lucide-react';

import { AmbientBackground } from '@/components/ambient-background';
import { LinkedInIcon } from '@/assets/svg/svgLogos';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ButtonLink } from '@/components/button-link';
import { useTranslation } from '@/hooks/use-translation';

const FRONTEND_STACK = [
  {
    name: 'React',
    description: 'UI library',
    icon: <BrainCircuit className="size-4" />,
    url: 'https://react.dev',
  },
  {
    name: 'TanStack Start',
    description: 'Full-stack framework (SSR)',
    icon: <Rocket className="size-4" />,
    url: 'https://tanstack.com/start',
  },
  {
    name: 'Vite',
    description: 'Build tool',
    icon: <Zap className="size-4" />,
    url: 'https://vite.dev',
  },
  {
    name: 'TanStack Router',
    description: 'Type-safe routing',
    icon: <Route className="size-4" />,
    url: 'https://tanstack.com/router',
  },
  {
    name: 'TanStack Form',
    description: 'Form management',
    icon: <BookOpen className="size-4" />,
    url: 'https://tanstack.com/form',
  },
  {
    name: 'TanStack Table',
    description: 'Headless table',
    icon: <Table2 className="size-4" />,
    url: 'https://tanstack.com/table',
  },
  {
    name: 'TanStack Query',
    description: 'Data fetching & caching',
    icon: <Database className="size-4" />,
    url: 'https://tanstack.com/query',
  },
  {
    name: 'shadcn/ui',
    description: 'Component library',
    icon: <Blocks className="size-4" />,
    url: 'https://ui.shadcn.com',
  },
  {
    name: 'Base UI',
    description: 'Component library',
    icon: <TableProperties className="size-4" />,
    url: 'https://base-ui.com',
  },
  {
    name: 'TypeScript',
    description: 'Programming language',
    icon: <Code2 className="size-4" />,
    url: 'https://typescriptlang.org',
  },
  {
    name: 'Tailwind CSS',
    description: 'Styling framework',
    icon: <Wind className="size-4" />,
    url: 'https://tailwindcss.com',
  },
  {
    name: 'Zod',
    description: 'Schema validation',
    icon: <ShieldCheck className="size-4" />,
    url: 'https://zod.dev',
  },
  {
    name: 'i18next',
    description: 'Internationalization',
    icon: <Languages className="size-4" />,
    url: 'https://www.i18next.com',
  },
  {
    name: 'Recharts',
    description: 'Charting library',
    icon: <ChartColumn className="size-4" />,
    url: 'https://recharts.org',
  },
  {
    name: 'Vitest',
    description: 'Unit testing',
    icon: <FlaskConical className="size-4" />,
    url: 'https://vitest.dev',
  },
] as const;

const BACKEND_STACK = [
  {
    name: 'Spring Boot 4',
    description: 'Application framework',
    icon: <Leaf className="size-4" />,
    url: 'https://spring.io/projects/spring-boot',
  },
  {
    name: 'Java 26',
    description: 'Programming language',
    icon: <Cpu className="size-4" />,
    url: 'https://openjdk.org/projects/jdk/26',
  },
  {
    name: 'PostgreSQL',
    description: 'Relational database',
    icon: <Database className="size-4" />,
    url: 'https://www.postgresql.org',
  },
  {
    name: 'Flyway',
    description: 'Database migrations',
    icon: <DatabaseZap className="size-4" />,
    url: 'https://www.red-gate.com/products/flyway',
  },
  {
    name: 'Spring Security',
    description: 'JWT auth & OAuth2 sign-in',
    icon: <KeyRound className="size-4" />,
    url: 'https://spring.io/projects/spring-security',
  },
  {
    name: 'Thymeleaf',
    description: 'Transactional email templates',
    icon: <Mail className="size-4" />,
    url: 'https://www.thymeleaf.org',
  },
  {
    name: 'Testcontainers',
    description: 'Integration testing',
    icon: <Container className="size-4" />,
    url: 'https://testcontainers.com',
  },
] as const;

type TechItem = {
  readonly name: string;
  readonly description: string;
  readonly icon: React.ReactNode;
  readonly url: string;
};

const TechBadgeList = ({
  items,
}: {
  readonly items: ReadonlyArray<TechItem>;
}) => (
  <div className="flex flex-wrap gap-2">
    {items.map((item) => (
      <div
        key={item.name}
        className="text-md border p-2 rounded-xl"
        title={item.description}
      >
        <div className="flex items-center gap-2">
          <span>{item.icon}</span>
          <span>{item.name}</span>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.name}
          >
            <ExternalLink className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
          </a>
        </div>
      </div>
    ))}
  </div>
);

const TechSection = ({
  icon,
  title,
  items,
}: {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly items: ReadonlyArray<TechItem>;
}) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2 text-sm font-medium">
      {icon}
      <span className="text-lg">{title}</span>
    </div>
    <TechBadgeList items={items} />
  </div>
);

export const About = () => {
  const { t } = useTranslation();

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4 px-4 py-8 mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback>
                <UserRound className="size-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>Nicu / GN33</CardTitle>
              <CardDescription>{t('aboutAuthorRole')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>{t('aboutAuthorBio')}</p>
          <p>{t('aboutAuthorInvite')}</p>
          <div className="flex gap-3 mt-1">
            <a
              href="https://www.linkedin.com/in/nicu-glavan-124a74105"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs hover:text-foreground transition-colors"
            >
              <LinkedInIcon className="size-3.5" />
              LinkedIn
            </a>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="size-5" />
            <CardTitle>{t('aboutTechStack')}</CardTitle>
          </div>
          <CardDescription>{t('aboutTechStackDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <TechSection
            icon={<Globe className="size-5" />}
            title={t('aboutFrontend')}
            items={FRONTEND_STACK}
          />
          <Separator />
          <TechSection
            icon={<Server className="size-5" />}
            title={t('aboutBackend')}
            items={BACKEND_STACK}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Store className="size-5" />
            <CardTitle>{t('aboutProjectTitle')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>{t('aboutProjectBody')}</p>
          <ButtonLink to="/" variant="outline">
            {t('aboutBrowseShop')}
          </ButtonLink>
        </CardContent>
      </Card>
      <AmbientBackground />

      <p className="py-2 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} gn33
      </p>
    </div>
  );
};
