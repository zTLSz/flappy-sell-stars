export const TOKEN_PACKAGES = [
  {
    id: "pack_10",
    tokens: 10,
    starsPrice: 1,
    label: "10 tokens",
    description: "10 in-game tokens"
  },
  {
    id: "pack_150",
    tokens: 150,
    starsPrice: 10,
    label: "150 tokens",
    description: "150 in-game tokens"
  },
  {
    id: "pack_900",
    tokens: 900,
    starsPrice: 50,
    label: "900 tokens",
    description: "900 in-game tokens"
  },
  {
    id: "pack_2000",
    tokens: 2000,
    starsPrice: 100,
    label: "2000 tokens",
    description: "2000 in-game tokens"
  }
];

export function getPublicPackages() {
  return TOKEN_PACKAGES.map(({ id, tokens, starsPrice, label }) => ({
    id,
    tokens,
    starsPrice,
    label
  }));
}

export function getPackageById(packageId) {
  return TOKEN_PACKAGES.find((pkg) => pkg.id === packageId) ?? null;
}
