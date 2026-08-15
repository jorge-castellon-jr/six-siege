# Six Siege

Companion tools for _Rainbow Six Siege: The Board Game_. Check line of sight on mapped floors, run tournament bans, look up operators, and roll combat dice.

This is an unofficial fan project and is not affiliated with Ubisoft.

## Tools

- **Line of Sight** (`/los`) — place operators on a map, break walls, drop smoke, and see whether they can see each other
- **Tournament Bans** (`/tournament-bans`) — ban maps between two teams
- **Operator Database** (`/operator-database`) — attacker and defender roster
- **Dice Roller** (`/dice-roller`) — yellow, orange, and red combat dice

Supported maps: Bank, Border, Chalet, Club House, Coastline, Consulate, Kafe, and Oregon.

## Development

```bash
pnpm install
pnpm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`). Useful scripts:

```bash
pnpm test          # vitest
pnpm run lint      # eslint
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Direct pushes to `main` are not allowed. Fork the repo, open a pull request, and wait for maintainer review.
