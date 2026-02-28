export const TOKEN_PACKAGES = [
  {
    id: "pack_100",
    tokens: 100,
    starsPrice: 1,
    label: "100 токенов",
    description: "100 игровых токенов"
  },
  {
    id: "pack_500",
    tokens: 500,
    starsPrice: 5,
    label: "500 токенов",
    description: "500 игровых токенов"
  },
  {
    id: "pack_1500",
    tokens: 1500,
    starsPrice: 10,
    label: "1500 токенов",
    description: "1500 игровых токенов"
  },
  {
    id: "pack_5000",
    tokens: 5000,
    starsPrice: 25,
    label: "5000 токенов",
    description: "5000 игровых токенов"
  },
  {
    id: "pack_15000",
    tokens: 15000,
    starsPrice: 50,
    label: "15000 токенов",
    description: "15000 игровых токенов"
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
