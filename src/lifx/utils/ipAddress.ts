const separatorRegex = /\s+/
const decoder = new TextDecoder()


/**
 * Return all host ip addresses of the machine
 */
export async function getAllHostIps(): Promise<string[]> {
	const p = Deno.run({
		cmd: ["hostname", "-I"],
		stdout: 'piped'
	})
	
	await p.status()
	
	const output = await p.output()
	const outputText = decoder.decode(output)
	return outputText.split(separatorRegex).filter(text => text !== "")
}

// regex used to check if string is IPv4 format
const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;

/**
 * Validates a given ip address is IPv4 format
 * @param  {String} ip IP address to validate
 * @return {Boolean}   is IPv4 format?
 */
export function isIpv4Format (ip: string) {
  return ipv4Regex.test(ip);
}
/**
 * Validates a given ip address is IPv4 broadcast address
 * @param  {String} ip IP address to validate
 * @return {Boolean}   is IPv4 format?
 */
export function isbroadcastAdress(ip: string) {
  return isIpv4Format(ip) && ip.endsWith(".255");
}