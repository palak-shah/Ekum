import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { youShortcutItems } from '@/features/settings/youShortcuts';
import { useAuth } from '@/lib/auth';
import { Avatar } from '@/ui/kit';
import { MoreActionsSheet } from '@/ui/MoreActionsSheet';
import { CollectionIcon, LockIcon, PencilIcon, UserIcon } from '@/ui/icons';

/** Map You menu rows to quiet icons (app-wide more chrome). */
function shortcutIcon(testId: string) {
  if (testId === 'profile') return <UserIcon width={20} height={20} />;
  if (testId === 'network') return <UserIcon width={20} height={20} />;
  if (testId === 'my-collections') return <CollectionIcon width={20} height={20} />;
  if (testId === 'settings') return <PencilIcon width={20} height={20} />;
  return <UserIcon width={20} height={20} />;
}

/** Home / My collections avatar — Profile, Network, library, Settings, Log out. */
export function HomeAccountMenu({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string | null;
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  const onLogout = () => {
    void logout().then(() => navigate('/login', { replace: true }));
  };

  return (
    <>
      <button
        type="button"
        data-testid="home-account"
        aria-label="Account"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((next) => !next)}
        className="rounded-full p-0.5"
      >
        <Avatar name={name} imageUrl={imageUrl} size={36} />
      </button>
      <MoreActionsSheet
        open={open}
        onClose={() => setOpen(false)}
        title={name.trim() || 'Account'}
        testId="home-account-menu"
        items={[
          ...youShortcutItems().map((item) => ({
            id: item.testId,
            label: item.label,
            icon: shortcutIcon(item.testId),
            testId: `home-account-${item.testId}`,
            onClick: () => {
              setOpen(false);
              navigate(item.to);
            },
          })),
          {
            id: 'logout',
            label: 'Log out',
            icon: <LockIcon width={20} height={20} />,
            testId: 'home-account-logout',
            danger: true,
            onClick: () => {
              setOpen(false);
              onLogout();
            },
          },
        ]}
      />
    </>
  );
}
