"use strict";
/**
 * LangGraph-style Workflow Graph.
 * Manages agent execution order, conditional routing, parallel execution,
 * retry logic, failure recovery, and state management.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowGraph = void 0;
const logger_1 = require("../../utils/logger");
class WorkflowGraph {
    nodes = new Map();
    edges = [];
    entryNode = null;
    addNode(node, options) {
        this.nodes.set(node.name, {
            node,
            retries: options?.retries ?? 1,
            parallel: options?.parallel,
        });
        return this;
    }
    addEdge(from, to, condition) {
        this.edges.push({ from, to, condition });
        return this;
    }
    setEntry(nodeName) {
        this.entryNode = nodeName;
        return this;
    }
    getNextNodes(currentNode, state) {
        const outEdges = this.edges.filter(e => e.from === currentNode);
        const next = [];
        for (const edge of outEdges) {
            if (!edge.condition || edge.condition(state)) {
                next.push(edge.to);
            }
        }
        return next;
    }
    async execute(initialState) {
        if (!this.entryNode) {
            throw new Error('No entry node defined in workflow graph');
        }
        let state = { ...initialState, status: 'running', startTime: Date.now() };
        const executionQueue = [this.entryNode];
        const executed = new Set();
        logger_1.logger.info(`[Graph] Starting workflow execution: ${state.id}`);
        while (executionQueue.length > 0) {
            const currentNodeName = executionQueue.shift();
            if (executed.has(currentNodeName))
                continue;
            const entry = this.nodes.get(currentNodeName);
            if (!entry) {
                logger_1.logger.warn(`[Graph] Node "${currentNodeName}" not found, skipping`);
                continue;
            }
            // Check if agent should execute based on current state
            if (!entry.node.shouldExecute(state)) {
                logger_1.logger.info(`[Graph] Skipping "${currentNodeName}" (condition not met)`);
                state.agentResults.push({
                    agentName: currentNodeName,
                    status: 'skipped',
                    executionTimeMs: 0,
                    warnings: [],
                    errors: [],
                    metadata: { reason: 'Condition not met' },
                });
                executed.add(currentNodeName);
                // Still add next nodes
                const nextNodes = this.getNextNodes(currentNodeName, state);
                executionQueue.push(...nextNodes);
                continue;
            }
            // Execute with retry logic
            state = await this.executeNodeWithRetry(entry, state);
            executed.add(currentNodeName);
            // Handle failure
            if (state.status === 'failed') {
                logger_1.logger.error(`[Graph] Pipeline failed at "${currentNodeName}"`);
                break;
            }
            // Determine next nodes (conditional routing)
            const nextNodes = this.getNextNodes(currentNodeName, state);
            executionQueue.push(...nextNodes);
        }
        state.endTime = Date.now();
        state.totalExecutionTimeMs = state.endTime - state.startTime;
        if (state.status !== 'failed') {
            state.status = 'completed';
        }
        logger_1.logger.info(`[Graph] Workflow completed in ${state.totalExecutionTimeMs}ms with status: ${state.status}`);
        return state;
    }
    async executeNodeWithRetry(entry, state) {
        const { node, retries } = entry;
        let lastError = null;
        for (let attempt = 1; attempt <= retries; attempt++) {
            const startTime = Date.now();
            state.currentAgent = node.name;
            logger_1.logger.info(`[Graph] Executing "${node.name}" (attempt ${attempt}/${retries})`);
            try {
                state = await node.execute(state);
                const executionTime = Date.now() - startTime;
                state.agentResults.push({
                    agentName: node.name,
                    status: 'success',
                    executionTimeMs: executionTime,
                    warnings: [],
                    errors: [],
                    metadata: {},
                });
                logger_1.logger.info(`[Graph] "${node.name}" completed in ${executionTime}ms`);
                return state;
            }
            catch (error) {
                lastError = error;
                const executionTime = Date.now() - startTime;
                logger_1.logger.error(`[Graph] "${node.name}" failed (attempt ${attempt}): ${lastError.message}`);
                if (attempt === retries) {
                    state.agentResults.push({
                        agentName: node.name,
                        status: 'failed',
                        executionTimeMs: executionTime,
                        warnings: [],
                        errors: [lastError.message],
                        metadata: { attempts: attempt },
                    });
                    // Non-critical agents don't fail the pipeline
                    if (this.isNonCritical(node.name)) {
                        logger_1.logger.warn(`[Graph] Non-critical agent "${node.name}" failed, continuing pipeline`);
                        return state;
                    }
                    state.status = 'failed';
                    state.error = `Agent "${node.name}" failed: ${lastError.message}`;
                }
            }
        }
        return state;
    }
    isNonCritical(nodeName) {
        const criticalNodes = ['input_processing', 'compression', 'validation'];
        return !criticalNodes.includes(nodeName);
    }
}
exports.WorkflowGraph = WorkflowGraph;
//# sourceMappingURL=graph.js.map