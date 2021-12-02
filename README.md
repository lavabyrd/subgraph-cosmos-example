# subgraph-cosmos-example

First you need to run:

1. Firehose, ingestor, merger and relayer
github.com/figment-networks/ingestor-tendermint

2. Graph node:
github.com/figment-networks/graph-node

Then you can create & deploy subgraph:
`yarn`
`yarn codegen`
`yarn build`
`yarn create` (or `yarn create-local`)
`yarn deploy` (or `yarn deploy-local`)
