export interface WhiroInput {
  newMoonAt: Date;
  sunsets: Date[];
}

export function calculateWhiroStart(input: WhiroInput): Date {
  const newMoonTime = input.newMoonAt.getTime();

  const whiro = input.sunsets
    .filter((sunset) => sunset.getTime() > newMoonTime)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  if (!whiro) {
    throw new Error('No sunset found after New Moon');
  }

  return whiro;
}