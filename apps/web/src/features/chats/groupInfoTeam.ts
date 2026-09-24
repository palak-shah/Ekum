import type { ThreadPersonView } from '@ekum/domain-types';

/** Our shop on this chat — never other companies’ staff. */
export function peopleOnOurSide(people: ThreadPersonView[]): ThreadPersonView[] {
  return people.filter((row) => row.state !== 'archived' && row.state !== 'left');
}

/** Staff first, owners last — same order as Team on chat. */
export function sortGroupTeam(people: ThreadPersonView[]): ThreadPersonView[] {
  const live = peopleOnOurSide(people);
  const staff = live.filter((row) => row.role !== 'owner');
  const owners = live.filter((row) => row.role === 'owner');
  return [...staff, ...owners];
}
