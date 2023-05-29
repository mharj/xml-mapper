import {assertNode, buildXmlPath} from './util';
import {parseDate, parseInteger, XmlMappingComposeFunction} from '.';

/**
 * reads string attribute value from current node (mapped to lookupKey)
 *
 * ```<root><node attrName="value" /></root> => {lookupKey: "value"}```
 */
export function attrStringValue(attrName?: string): XmlMappingComposeFunction<string> {
	return function ({lookupKey, node, rootNode}) {
		assertNode(node, rootNode, `attrStringValue ${attrName || lookupKey} got null node from ${buildXmlPath(rootNode)} key: ${lookupKey}`);
		return (node as Element).getAttribute(attrName || lookupKey);
	};
}

/**
 * reads number attribute value from current node and maps it to used lookupKey or attrName
 *
 * ```<root><node attrName="123" /></root> => {lookupKey: 123}```
 */
export function attrNumberValue(attrName?: string): XmlMappingComposeFunction<number> {
	return function (props) {
		return parseInteger(attrStringValue(attrName)(props));
	};
}

/**
 * reads Date attribute value from current node and maps it to used lookupKey or attrName
 *
 * ```<root><node attrName="2020-01-01T00:00:00.000Z" /></root> => {lookupKey: new Date("2020-01-01T00:00:00.000Z")}```
 */
export function attrDateValue(attrName?: string): XmlMappingComposeFunction<Date> {
	return function (props) {
		return parseDate(attrStringValue(attrName)(props));
	};
}

/**
 * reads string attribute value from rootNode and maps it to used lookupKey or attrName
 *
 * ```<root attrName="value" /><node /></root> => {lookupKey: "value"}```
 */
export function rootAttrStringValue(attrName?: string): XmlMappingComposeFunction<string> {
	return function ({lookupKey, rootNode}) {
		return (rootNode as Element).getAttribute(attrName || lookupKey);
	};
}

/**
 * reads number attribute value from rootNode and maps it to used lookupKey or attrName
 *
 * ```<root attrName="123" /><node /></root> => {lookupKey: 123}```
 */
export function rootAttrNumberValue(attrName?: string): XmlMappingComposeFunction<number> {
	return function (props) {
		return parseInteger(rootAttrStringValue(attrName)(props));
	};
}

/**
 * reads Date attribute value from rootNode and maps it to used lookupKey or attrName
 *
 * ```<root attrName="2020-01-01T00:00:00.000Z" /><node /></root> => {lookupKey: new Date("2020-01-01T00:00:00.000Z")}```
 */
export function rootAttrDateValue(attrName?: string): XmlMappingComposeFunction<Date> {
	return function (props) {
		return parseDate(rootAttrStringValue(attrName)(props));
	};
}
