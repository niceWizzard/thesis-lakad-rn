package expo.modules.algorithmmodule

import kotlin.random.Random

/**
 * Internal POI representation based on study factors[cite: 779, 791].
 */
data class InternalPOI(
    val id: String,
    val interestValue: Double, // User interest score [cite: 791, 812]
    val rating: Double,        // Google Maps/User rating [cite: 819, 831]
    val popularity: Int = 1    // Default popularity if not provided [cite: 821]
)

data class Itinerary(
    var pois: MutableList<InternalPOI>,
    var fitness: Double = 0.0,
    var totalDistance: Double = 0.0,
) {
    fun copy(): Itinerary = Itinerary(pois.toMutableList(), fitness, totalDistance)
}

class AGAMOptimizer(
    private val populationSize: Int = 50,
    private val maxDistance: Double, // MAXD constraint [cite: 752, 838]
    private val maxPOIs: Int,        // MAXN constraint [cite: 814, 838]
    private val weights: DoubleArray, // [w1, w2, w3, w4] [cite: 788, 838]
    private val jsPois: Map<String, Map<String, Any>>, // JS Object param 1
    private val distanceMap: Map<String, Map<String, Double>> // JS Object param 2
) {
    private val pc1 = 0.9 // Crossover control [cite: 766, 838]
    private val pc2 = 0.6
    private val pm1 = 0.1 // Mutation control [cite: 773, 838]
    private val pm2 = 0.01

    // Map the JS data into InternalPOI objects
    private val allPOIs: List<InternalPOI> = jsPois.map { (id, data) ->
        InternalPOI(
            id = id,
            rating = (data["rating"] as? Number)?.toDouble() ?: 0.0,
            interestValue = (data["interest"] as? Number)?.toDouble() ?: 0.0
        )
    }

    /**
     * Calculates fitness score using the weighted multi-objective function[cite: 788].
     * Z = w1(Interest) + w2(Total N) + w3(Rating) + w4(Popularity)[cite: 788, 790].
     */
    private fun calculateFitness(itinerary: Itinerary) {
        if (itinerary.pois.isEmpty()) {
            itinerary.fitness = 0.0
            return
        }
        val fInterest = itinerary.pois.sumOf { it.interestValue }
        val fTotalN = itinerary.pois.size.toDouble() / allPOIs.size
        val fRating = itinerary.pois.sumOf { it.rating } / (allPOIs.size * 5.0)
        val fPopularity = itinerary.pois.sumOf { it.popularity.toDouble() } // Simplified [cite: 821]

        itinerary.fitness = (weights[0] * fInterest) +
                (weights[1] * fTotalN) +
                (weights[2] * fRating) +
                (weights[3] * (fPopularity / allPOIs.size))
    }

    /**
     * Retrieves distance between two POIs from the provided nested Map[cite: 627, 963].
     */
    private fun getDistance(fromId: String, toId: String): Double {
        return distanceMap[fromId]?.get(toId) ?: 10000.0 // Penalty for missing path
    }

    private fun calculateTotalDistance(pois: List<InternalPOI>): Double {
        if (pois.size < 2) return 0.0
        var dist = 0.0
        for (i in 0 until pois.size - 1) {
            dist += getDistance(pois[i].id, pois[i+1].id)
        }
        return dist
    }

    /**
     * Generates a personalized itinerary using AGAM[cite: 751, 838].
     */
    fun evolve(generations: Int): Map<String, Any> {
        var population = List(populationSize) { generateRandomItinerary() }

        repeat(generations) {
            population.forEach { calculateFitness(it) }
            val fMax = population.maxOf { it.fitness }
            val fAvg = population.map { it.fitness }.average()
            val nextGen = mutableListOf<Itinerary>()

            while (nextGen.size < populationSize) {
                val p1 = population.random()
                val p2 = population.random()
                val fSelMax = maxOf(p1.fitness, p2.fitness)

                if (Random.nextDouble() < getCrossoverProbability(fSelMax, fAvg, fMax)) {
                    val (c1, c2) = performCrossover(p1, p2)
                    validateAndRepair(c1)
                    validateAndRepair(c2)
                    nextGen.add(c1); nextGen.add(c2)
                } else {
                    nextGen.add(p1.copy()); nextGen.add(p2.copy())
                }
            }

            nextGen.forEach {
                if (Random.nextDouble() < getMutationProbability(it.fitness, fAvg, fMax)) {
                    applyMutation(it)
                    validateAndRepair(it)
                }
            }
            population = nextGen.take(populationSize)
        }

        val best = population.maxByOrNull { it.fitness } ?: population[0]
        return mapOf(
            "poiIds" to best.pois.map { it.id },
            "totalDistance" to best.totalDistance,
            "fitness" to best.fitness
        )
    }

    private fun validateAndRepair(itinerary: Itinerary) {
        // Pruning: Remove last POIs if distance or count is exceeded [cite: 838]
        while ((calculateTotalDistance(itinerary.pois) > maxDistance || itinerary.pois.size > maxPOIs) && itinerary.pois.isNotEmpty()) {
            itinerary.pois.removeAt(itinerary.pois.size - 1)
        }

        // Greedy Insertion: Add unvisited POIs if they fit the budget [cite: 838]
        val unvisited = allPOIs.filter { poi -> itinerary.pois.none { it.id == poi.id } }.shuffled()
        for (poi in unvisited) {
            val tempPois = itinerary.pois.toMutableList()
            tempPois.add(poi)
            if (calculateTotalDistance(tempPois) <= maxDistance && tempPois.size <= maxPOIs) {
                itinerary.pois.add(poi)
            }
        }
        itinerary.totalDistance = calculateTotalDistance(itinerary.pois)
    }

    private fun performCrossover(p1: Itinerary, p2: Itinerary): Pair<Itinerary, Itinerary> {
        if (p1.pois.isEmpty() || p2.pois.isEmpty()) return Pair(p1.copy(), p2.copy())
        val crossPoint = Random.nextInt(minOf(p1.pois.size, p2.pois.size))

        val c1Pois = (p1.pois.take(crossPoint) + p2.pois.drop(crossPoint)).distinctBy { it.id }.toMutableList()
        val c2Pois = (p2.pois.take(crossPoint) + p1.pois.drop(crossPoint)).distinctBy { it.id }.toMutableList()

        return Pair(Itinerary(c1Pois), Itinerary(c2Pois))
    }

    private fun applyMutation(itinerary: Itinerary) {
        if (itinerary.pois.isNotEmpty()) {
            val index = Random.nextInt(itinerary.pois.size)
            val replacement = allPOIs.random()
            if (itinerary.pois.none { it.id == replacement.id }) {
                itinerary.pois[index] = replacement
            }
        }
    }

    private fun generateRandomItinerary(): Itinerary {
        val itinerary = Itinerary(allPOIs.shuffled().take(Random.nextInt(1, maxPOIs + 1)).toMutableList())
        validateAndRepair(itinerary)
        return itinerary
    }

    private fun getCrossoverProbability(fSelectedMax: Double, fAvg: Double, fMax: Double): Double {
        return if (fSelectedMax >= fAvg && fMax != fAvg) pc1 - ((pc1 - pc2) * (fSelectedMax - fAvg)) / (fMax - fAvg) else pc1
    }

    private fun getMutationProbability(fIndividual: Double, fAvg: Double, fMax: Double): Double {
        return if (fIndividual >= fAvg && fMax != fAvg) pm1 - ((pm1 - pm2) * (fIndividual - fAvg)) / (fMax - fAvg) else pm1
    }
}