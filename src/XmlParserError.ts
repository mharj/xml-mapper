/**
 * XmlParserError class which contains XML node for where parsing failed
 */
export class XmlParserError extends Error {
	public readonly node: Node;
	constructor(message: string, node: Node) {
		super(message);
		this.node = node;
		this.name = 'XmlParserError';
		Error.captureStackTrace(this, this.constructor);
	}
}
