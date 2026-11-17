/**
 * Cold Message/Chat: open existing Direct, else compose first message (no empty create).
 */
export function coldMessageAction(input: {
  existingThreadId: string | null | undefined;
}): 'open-existing' | 'compose-first' {
  return input.existingThreadId ? 'open-existing' : 'compose-first';
}
