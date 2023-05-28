import {assertNode, buildXmlPath} from './util';
import {XmlMappingComposeFunction} from '.';

/**
 * reads string value from current node (mapped from node name)
 *
 * ```<root><node>value</node></root> => {node: "value"}```
 */
export const stringValue: XmlMappingComposeFunction<string> = ({lookupKey, node, rootNode}) => {
	assertNode(node, rootNode, `stringValue got null node from ${buildXmlPath(rootNode)} key: ${lookupKey}`);
	if (node.childNodes.length !== 1) {
		// empty element
		return null;
	}
	return node.childNodes[0].nodeValue;
};

/**
 * reads number value from current node (mapped from node name)
 *
 * ```<root><node>123</node></root> => {node: 123}```
 */
export const integerValue: XmlMappingComposeFunction<number> = (props) => {
	const value = stringValue(props);
	return value ? parseInt(value, 10) : null;
};

/**
 * reads date value from current node (mapped from node name)
 *
 * ```<root><node>2021-01-01</node></root> => {node: Date("2021-01-01")}```
 */
export const dateValue: XmlMappingComposeFunction<Date> = (props) => {
	const value = stringValue(props);
	return value ? new Date(value) : null;
};

export const unknownValue: XmlMappingComposeFunction<unknown> = ({lookupKey, node, rootNode, opts: {logger}}) => {
	assertNode(node, rootNode, `key ${lookupKey} Unknown value got null node`);
	if (node.textContent) {
		logger?.warn(node.textContent);
	}
	return null;
};
