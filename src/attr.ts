import {assertNode, buildXmlPath} from './util';
import {XmlMappingComposeFunction} from '.';

/**
 * reads string attribute value from current node (mapped to lookupKey)
 *
 * ```<root><node attrName="value" /></root> => {lookupKey: "value"}```
 */
export function attrStringValue(attrName: string): XmlMappingComposeFunction<string> {
	return function ({lookupKey, node, rootNode}) {
		assertNode(node, rootNode, `attrStringValue ${attrName} got null node from ${buildXmlPath(rootNode)} key: ${lookupKey}`);
		return (node as Element).getAttribute(attrName);
	};
}

/**
 * reads number attribute value from current node and maps it to used lookupKey
 *
 * ```<root><node attrName="123" /></root> => {lookupKey: 123}```
 */
export function attrNumberValue(attrName: string): XmlMappingComposeFunction<number> {
	return function (props) {
		const value = attrStringValue(attrName)(props);
		return value !== null ? parseInt(value, 10) : null;
	};
}

/**
 * reads string attribute value from rootNode and maps it to used lookupKey
 *
 * ```<root attrName="value" /><node /></root> => {lookupKey: "value"}```
 */
export function rootAttrStringValue(attrName: string): XmlMappingComposeFunction<string> {
	return function ({rootNode}) {
		return (rootNode as Element).getAttribute(attrName);
	};
}

/**
 * reads number attribute value from rootNode and maps it to used lookupKey
 *
 * ```<root attrName="123" /><node /></root> => {lookupKey: 123}```
 */
export function rootAttrNumberValue(attrName: string): XmlMappingComposeFunction<number> {
	return function ({rootNode}) {
		const value = (rootNode as Element).getAttribute(attrName);
		return value !== null ? parseInt(value, 10) : null;
	};
}
