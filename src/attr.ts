import {BaseMapperFunction, ObjectMapperFunction} from '.';
import {assertNode} from './util';

/**
 * reads string attribute value from current node
 */
export function attrStringValue(attr: string): BaseMapperFunction<string> {
	return function (node) {
		assertNode(node);
		return (node as Element).getAttribute(attr);
	};
}

/**
 * reads number attribute value from current node
 */
export function attrNumberValue(attr: string): BaseMapperFunction<number> {
	return function (node) {
		assertNode(node);
		const value = (node as Element).getAttribute(attr);
		return value !== null ? parseInt(value, 10) : null;
	};
}

/**
 * reads string attribute value from rootNode
 */
export function rootAttrStringValue(attr: string): ObjectMapperFunction<string> {
	return function (node, rootNode) {
		return (rootNode as Element).getAttribute(attr);
	};
}

/**
 * reads number attribute value from rootNode
 */
export function rootAttrNumberValue(attr: string): ObjectMapperFunction<number> {
	return function (node, rootNode) {
		const value = (rootNode as Element).getAttribute(attr);
		return value !== null ? parseInt(value, 10) : null;
	};
}
