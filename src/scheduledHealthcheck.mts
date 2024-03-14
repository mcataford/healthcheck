import axios from 'axios'
import { getStore } from '@netlify/blobs'
import type { Context } from '@netlify/functions'

interface Endpoint {
	name: string
	url: string
}

interface Configuration {
	endpoints: Endpoint[]
	webhook_url: string
}

interface EndpointReport extends Endpoint {
	status: number
	healthy: boolean
}

/*
 * Sends a GET request to the specified Endpoint url and reports on whether
 * the response given back was a success or not.
 *
 * Any error when handling the request (request-related or not) is deemed
 * to be a failing ping.
 *
 * Returns an EndpointReport, which is the Endpoint used as input with
 * extra status information.
 */
async function pingEndpoint(endpoint: Endpoint): Promise<EndpointReport> {
	try {
		const response = await axios.get(endpoint.url)

		return {
			...endpoint,
			status: response.status,
			healthy: true,
		}
	} catch (e) {
		return {
			...endpoint,
			healthy: false,
			status: e.response.status,
		}
	}
}

/*
 * Formats endpoint reports into a string that can be posted to the Discord webhook.
 *
 * The report is assembled line-by-line and joined together as one.
 */
function formatReport(endpointReports: EndpointReport[]): string {
	const endpointStatuses = endpointReports.map((report: EndpointReport): string => {
		if (report.healthy) return `✅ ${report.name} is healthy (${report.status})`

		return `🔥 ${report.name} did not respond normally (${report.status})`
	})

	return endpointStatuses.join('\n')
}

/*
 * Pings all endpoints configured to be healthchecked and sends a report on the success/failure
 * of requests to the Discord webhook included in the configuration.
 *
 * This expects DISCORD_WEBHOOK_ID and DISCORD_WEBHOOK_TOKEN to be configured through
 * the available environment variables separately.
 */
export default async (request: Request, context: Context) => {
	//const conf: Configuration = require("../config.json")
	const configurationStore = getStore('functions')
	const conf: Configuration = await configurationStore.get('config', {
		type: 'json',
	})

	const pings = await Promise.all(conf.endpoints.map(pingEndpoint))

	const report = formatReport(pings)
	const webhook_url = conf.webhook_url
		.replace('$DISCORD_WEBHOOK_ID', process.env.DISCORD_WEBHOOK_ID)
		.replace('$DISCORD_WEBHOOK_TOKEN', process.env.DISCORD_WEBHOOK_TOKEN)
	await axios.post(webhook_url, { content: report })

	return new Response()
}
