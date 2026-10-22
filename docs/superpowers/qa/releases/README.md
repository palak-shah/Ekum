# Release evidence

One JSON file per git SHA: `<fullSha>.json`. Shape: [TEMPLATE.json](./TEMPLATE.json).

Created by `pnpm release:check`. Device rows by `pnpm release:signoff`. Production `pnpm docker:up` (`EKUM_DEPLOYMENT=production`) requires `decision` `PASS` or `EXCEPTION_APPROVED` for **HEAD**.

Do not copy this template in as a real SHA. Viewport smoke cannot mark device rows `pass`.

See [RELEASE.md](../RELEASE.md).
