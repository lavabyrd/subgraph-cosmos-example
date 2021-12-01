# subgraph-cosmos-example

First you need to run graph-node and ipfs:
`git clone git@github.com:figment-networks/graph-node.git`

`docker-compose up`
or manually:

1. Install IPFS and run `ipfs init` followed by `ipfs daemon`.
2. Install PostgreSQL and run `initdb -D .postgres` followed by `pg_ctl -D .postgres -l logfile start` and `createdb graph-node`.
3. If using Ubuntu, you may need to install additional packages:
   - `sudo apt-get install -y clang libpq-dev libssl-dev pkg-config`

Then create & deploy subgraph:
`yarn`
`yarn codegen`
`yarn build`
`yarn create` (or `yarn create-local`)
`yarn deploy` (or `yarn deploy-local`)
