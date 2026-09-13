import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StartChatSheet } from './StartChatSheet';
import { api, ApiError } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    code: string;
    details: unknown;
    constructor(envelope: { message: string; code: string; details?: unknown }) {
      super(envelope.message);
      this.name = 'ApiError';
      this.code = envelope.code;
      this.details = envelope.details;
    }
  },
}));

const showToast = vi.fn();

vi.mock('@/ui/Toast', () => ({
  useToast: () => ({ showToast }),
}));

vi.mock('@/lib/teamCaps', () => ({
  useTeamCaps: () => ({
    can: () => true,
    isOwner: true,
  }),
}));

const shop = (id: string, name: string, city: string) => ({
  id: `c-${id}`,
  status: 'active',
  createdAt: '2026-01-01',
  canPause: true,
  canResume: false,
  canBlock: true,
  canUnblock: false,
  company: {
    id,
    name,
    city,
    verification: 'none',
    logoUrl: null,
  },
});

function mockGets(opts: { connections: unknown[]; team: unknown[] }) {
  vi.mocked(api.get).mockImplementation(async (path: string) => {
    if (path === '/connections') return opts.connections;
    if (path === '/access-requests/outgoing') return [];
    if (path === '/search') return { results: [], nextCursor: null };
    if (path === '/team/members') return opts.team;
    throw new Error(`unexpected ${path}`);
  });
}

const staffTeam = [
  { userId: 'u-owner', name: 'Ravi', role: 'owner' },
  { userId: 'u-1', name: 'Pushya', role: 'staff' },
  { userId: 'u-2', name: 'Amit', role: 'staff' },
];

function renderSheet() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <StartChatSheet open onClose={() => {}} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('StartChatSheet', () => {
  beforeEach(() => {
    showToast.mockReset();
    mockGets({ connections: [], team: staffTeam });
  });

  function directThread(
    id: string,
    opened: 'created' | 'existing' | 'restored',
    name = 'Jaipur Emporium',
  ) {
    return {
      id,
      opened,
      counterpart: { id: 'co-1', name, city: 'Jaipur', verification: 'none', logoUrl: null },
    };
  }

  it('starts on businesses with no pills or helper copy', async () => {
    renderSheet();

    expect(screen.getByRole('heading', { name: 'New chat' })).toBeInTheDocument();
    expect(screen.queryByText(/Your team and one or more/)).toBeNull();
    expect(screen.queryByTestId('start-chat-panes')).toBeNull();
    expect(screen.getByRole('button', { name: 'Pick a business' })).toBeDisabled();
    expect(screen.getByLabelText('Group name')).not.toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Add your team' })).toBeNull();
    expect(screen.getByPlaceholderText('Search name or city…')).toBeVisible();
  });

  it('opens a 1:1 with nobody selected via Open chat', async () => {
    const user = userEvent.setup();
    mockGets({
      connections: [shop('co-1', 'Jaipur Emporium', 'Jaipur')],
      team: staffTeam,
    });
    vi.mocked(api.post).mockResolvedValue(directThread('thread-d', 'created'));

    renderSheet();
    await screen.findByText('Jaipur Emporium');
    await user.click(screen.getByText('Jaipur Emporium'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { name: 'Add your team' })).toBeVisible();
    expect(screen.getByText('Optional — add teammates.')).toBeVisible();
    expect(screen.getByText('Pushya')).toBeVisible();
    expect(screen.queryByLabelText('Search your team')).toBeNull();
    expect(screen.queryByRole('button', { name: 'skip' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Open chat with Jaipur Emporium' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Open chat with Jaipur Emporium' }));
    expect(api.post).toHaveBeenCalledWith('/threads/direct', {
      companyId: 'co-1',
      memberUserIds: [],
    });
    expect(showToast).toHaveBeenCalledWith('Chat started with Jaipur Emporium', 'success');
  });

  it('sends selected staff on Open chat', async () => {
    const user = userEvent.setup();
    mockGets({
      connections: [shop('co-1', 'Jaipur Emporium', 'Jaipur')],
      team: staffTeam,
    });
    vi.mocked(api.post).mockResolvedValue(directThread('thread-d', 'existing'));

    renderSheet();
    await screen.findByText('Jaipur Emporium');
    await user.click(screen.getByText('Jaipur Emporium'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByText('Pushya'));
    await user.click(screen.getByRole('button', { name: 'Open chat with Jaipur Emporium' }));
    expect(api.post).toHaveBeenCalledWith('/threads/direct', {
      companyId: 'co-1',
      memberUserIds: ['u-1'],
    });
  });

  it('asks for the group name after team, and Back keeps selection', async () => {
    const user = userEvent.setup();
    mockGets({
      connections: [
        shop('co-1', 'Jaipur Emporium', 'Jaipur'),
        shop('co-2', 'Ring Road Silks', 'Surat'),
      ],
      team: staffTeam,
    });
    vi.mocked(api.post).mockResolvedValue({ id: 'thread-g' });

    renderSheet();
    await screen.findByText('Jaipur Emporium');
    await user.click(screen.getByText('Jaipur Emporium'));
    await user.click(screen.getByText('Ring Road Silks'));
    expect(screen.getByLabelText('Group name')).not.toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { name: 'Add your team' })).toBeVisible();
    await user.click(screen.getByText('Amit'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { name: 'New group' })).toBeVisible();
    expect(screen.getByLabelText('Group name')).toBeVisible();
    expect(screen.getByTestId('sheet-back')).toHaveAttribute('aria-label', 'Back');
    await user.click(screen.getByTestId('sheet-back'));
    expect(screen.getByRole('heading', { name: 'Add your team' })).toBeVisible();
    expect(screen.getByText('Amit').closest('button')).toHaveClass('border-accent');
    await user.click(screen.getByTestId('sheet-back'));
    expect(screen.getByRole('heading', { name: 'New chat' })).toBeVisible();
    expect(screen.getAllByText('Jaipur Emporium').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.type(screen.getByLabelText('Group name'), 'Surat buyers');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(api.post).toHaveBeenCalledWith('/threads/group', {
      title: 'Surat buyers',
      participantCompanyIds: ['co-1', 'co-2'],
      memberUserIds: ['u-2'],
    });
  });

  it('skips the team step when there is no staff', async () => {
    const user = userEvent.setup();
    mockGets({
      connections: [
        shop('co-1', 'Jaipur Emporium', 'Jaipur'),
        shop('co-2', 'Ring Road Silks', 'Surat'),
      ],
      team: [{ userId: 'u-owner', name: 'Ravi', role: 'owner' }],
    });
    vi.mocked(api.post).mockResolvedValue({ id: 'thread-g' });

    renderSheet();
    await screen.findByText('Jaipur Emporium');
    await user.click(screen.getByText('Jaipur Emporium'));
    await user.click(screen.getByText('Ring Road Silks'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { name: 'New group' })).toBeVisible();
    await user.click(screen.getByTestId('sheet-back'));
    expect(screen.getByRole('heading', { name: 'New chat' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.type(screen.getByLabelText('Group name'), 'Surat buyers');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(api.post).toHaveBeenCalledWith('/threads/group', {
      title: 'Surat buyers',
      participantCompanyIds: ['co-1', 'co-2'],
      memberUserIds: [],
    });
  });

  it('opens a 1:1 via Open chat without selecting staff', async () => {
    const user = userEvent.setup();
    mockGets({
      connections: [shop('co-1', 'Jaipur Emporium', 'Jaipur')],
      team: staffTeam,
    });
    vi.mocked(api.post).mockResolvedValue(directThread('thread-d', 'existing'));

    renderSheet();
    await screen.findByText('Jaipur Emporium');
    await user.click(screen.getByText('Jaipur Emporium'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByText('Pushya'));
    expect(screen.queryByRole('button', { name: 'skip' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Open chat with Jaipur Emporium' }));
    expect(api.post).toHaveBeenCalledWith('/threads/direct', {
      companyId: 'co-1',
      memberUserIds: [],
    });
    expect(showToast).toHaveBeenCalledWith('Opened chat with Jaipur Emporium', 'success');
  });

  it('goes to group name via Skip when two shops are picked', async () => {
    const user = userEvent.setup();
    mockGets({
      connections: [
        shop('co-1', 'Jaipur Emporium', 'Jaipur'),
        shop('co-2', 'Ring Road Silks', 'Surat'),
      ],
      team: staffTeam,
    });

    renderSheet();
    await screen.findByText('Jaipur Emporium');
    await user.click(screen.getByText('Jaipur Emporium'));
    await user.click(screen.getByText('Ring Road Silks'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByText('Amit'));
    await user.click(screen.getByRole('button', { name: 'skip' }));
    expect(screen.getByRole('heading', { name: 'New group' })).toBeVisible();
    expect(screen.getByLabelText('Group name')).toBeVisible();
  });

  it('shows team search when there are 10 or more staff', async () => {
    const user = userEvent.setup();
    const largeTeam = [
      { userId: 'u-owner', name: 'Ravi', role: 'owner' },
      ...Array.from({ length: 10 }, (_, i) => ({
        userId: `u-${i}`,
        name: `Staff ${i + 1}`,
        role: 'staff',
      })),
    ];
    mockGets({
      connections: [shop('co-1', 'Jaipur Emporium', 'Jaipur')],
      team: largeTeam,
    });

    renderSheet();
    await screen.findByText('Jaipur Emporium');
    await user.click(screen.getByText('Jaipur Emporium'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByLabelText('Search your team')).toBeVisible();
  });

  it('shows Open chat when the group already exists', async () => {
    const user = userEvent.setup();
    mockGets({
      connections: [
        shop('co-1', 'Jaipur Emporium', 'Jaipur'),
        shop('co-2', 'Ring Road Silks', 'Surat'),
      ],
      team: [{ userId: 'u-owner', name: 'Ravi', role: 'owner' }],
    });
    vi.mocked(api.post).mockRejectedValue(
      new ApiError({
        statusCode: 409,
        code: 'SAME_CHAT',
        message: 'That’s the same as Surat buyers. Open that chat?',
        details: { threadId: 'thread-existing', title: 'Surat buyers' },
      }),
    );

    renderSheet();
    await screen.findByText('Jaipur Emporium');
    await user.click(screen.getByText('Jaipur Emporium'));
    await user.click(screen.getByText('Ring Road Silks'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.type(screen.getByLabelText('Group name'), 'Another name');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(screen.getByText('Same as Surat buyers.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open chat' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Create' })).toBeNull();
  });
});
