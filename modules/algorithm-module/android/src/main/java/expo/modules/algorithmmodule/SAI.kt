package expo.modules.algorithmmodule

import kotlin.math.exp
import kotlin.random.Random

/**
 * Calculates the total cost of the tour.
 */
fun tourCost(graph: Map<String, Map<String, Double>>, path: List<String>): Double {
    var total = 0.0
    for (i in path.indices) {
        val u = path[i]
        val v = path[(i + 1) % path.size]
        total += graph[u]?.get(v) ?: Double.POSITIVE_INFINITY
    }
    return total
}

/**
 * Improved Simulated Annealing for TSP using String keys.
 */
fun simulatedAnnealingImproved(
    graph: Map<String, Map<String, Double>>,
    tStart: Double = 1000.0,
    tEnd: Double = 1.0,
    coolingRate: Double = 0.999
): Pair<Double, List<String>> {

    fun getCost(u: String, v: String): Double {
        return graph[u]?.get(v) ?: Double.POSITIVE_INFINITY
    }

    // Nodes are now a list of Strings
    val nodes = graph.keys.toList()
    val n = nodes.size
    if (n == 0) return Pair(0.0, emptyList())

    val iterPerTemp = (n * 1.5).toInt()

    var currentTour = nodes.shuffled().toMutableList()
    var currentCost = tourCost(graph, currentTour)

    var bestTour = currentTour.toList()
    var bestCost = currentCost

    var t = tStart

    while (t > tEnd) {
        repeat(iterPerTemp) {
            // Pick two random distinct indices
            val a = Random.nextInt(n)
            var b = Random.nextInt(n)
            while (a == b) { b = Random.nextInt(n) }

            // Skip if the swap doesn't make sense (neighboring nodes)
            if (kotlin.math.abs(a - b) <= 1 || kotlin.math.abs(a - b) == n - 1) {
                return@repeat
            }

            val nodeAIdx = a
            val nodePrevIdx = (a - 1 + n) % n
            val nodeNextIdx = (a + 1) % n
            val nodeBIdx = b
            val nodeCIdx = (b + 1) % n

            // Accessing the String labels by their index in the current tour
            val nodePrev = currentTour[nodePrevIdx]
            val nodeA = currentTour[nodeAIdx]
            val nodeNext = currentTour[nodeNextIdx]
            val nodeB = currentTour[nodeBIdx]
            val nodeC = currentTour[nodeCIdx]

            val costRemoved = getCost(nodePrev, nodeA) +
                    getCost(nodeA, nodeNext) +
                    getCost(nodeB, nodeC)

            val costAdded = getCost(nodePrev, nodeNext) +
                    getCost(nodeB, nodeA) +
                    getCost(nodeA, nodeC)

            val delta = costAdded - costRemoved

            if (delta < 0 || Random.nextDouble() < exp(-delta / t)) {
                val node = currentTour.removeAt(nodeAIdx)

                val targetIdx = if (nodeAIdx < nodeBIdx) nodeBIdx else nodeBIdx + 1
                currentTour.add(targetIdx, node)

                currentCost += delta

                if (currentCost < bestCost) {
                    bestCost = currentCost
                    bestTour = currentTour.toList()
                }
            }
        }
        t *= coolingRate
    }
    return Pair(bestCost, bestTour)
}