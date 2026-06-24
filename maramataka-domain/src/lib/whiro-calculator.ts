export interface WhiroInput {
  newMoonAt: Date;
  sunsets: Date[];
}

export function calculateWhiroStart(input: WhiroInput): Date {
  const whiro = input.sunsets.find(
    sunset => sunset.getTime() >= input.newMoonAt.getTime()
  );

  if (!whiro) {
    throw new Error('No sunset found after New Moon');
  }

  return whiro;
}