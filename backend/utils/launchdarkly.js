const {init} = require('@launchdarkly/node-server-sdk');
const {Observability} = require('@launchdarkly/observability-node');

const client = init(process.env.LAUNCHDARKLY_SDK_KEY, {
    plugins: [
        new Observability({
            service: 'ri-tee-times',
        }),
    ],
});

module.exports = {client};
