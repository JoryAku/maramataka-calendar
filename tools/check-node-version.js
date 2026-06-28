const supportedRanges = [
  {
    major: 20,
    minimumMinor: 19,
    minimumPatch: 0,
    label: '20.19.0 or newer in the Node 20 line',
  },
  {
    major: 22,
    minimumMinor: 12,
    minimumPatch: 0,
    label: '22.12.0 or newer',
  },
];

const [major, minor, patch] = process.versions.node
  .split('.')
  .map((part) => Number(part));

const isSupported = supportedRanges.some((range) => {
  if (major !== range.major) {
    return false;
  }

  if (minor > range.minimumMinor) {
    return true;
  }

  return minor === range.minimumMinor && patch >= range.minimumPatch;
});

if (!isSupported) {
  const supportedLabels = supportedRanges
    .map((range) => range.label)
    .join(', or ');

  console.error(
    [
      `Unsupported Node.js version ${process.versions.node}.`,
      `Use ${supportedLabels}.`,
      'If you use nvm, run `nvm use` from the repo root before running checks.',
    ].join('\n'),
  );
  process.exit(1);
}

