# subgraph-cosmos-example

First you need to run graph-node and ipfs:
`git clone git@github.com:figment-networks/graph-node.git`

`docker-compose up`
or manually:

Then create & deploy subgraph:
`yarn`
`yarn codegen`
`yarn build`
`yarn create` (or `yarn create-local`)
`yarn deploy` (or `yarn deploy-local`)
