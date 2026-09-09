import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with LLD problems...");

  // Clear existing problems for clean idempotent seed
  await prisma.evaluationCriterion.deleteMany({});
  await prisma.evaluation.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.attempt.deleteMany({});
  await prisma.problem.deleteMany({});

  const problems = [
    {
      slug: "parking-lot",
      title: "Design a Multi-Floor Parking Lot System",
      difficulty: "MEDIUM",
      shortDescription:
        "Design a robust, scalable low-level object-oriented system for an automated multi-floor parking lot supporting different vehicle types, dynamic fee strategies, and concurrent space allocation.",
      problemStatement: `Design an object-oriented system for an automated multi-level parking lot.
The system is responsible for managing multiple entry and exit terminals, allocating parking spots based on vehicle type and proximity, issuing tickets upon entry, and calculating parking fees dynamically upon exit.

Your design should exhibit high cohesion, loose coupling, clean separation of concerns, and open extensibility for future pricing models or spot assignment strategies.`,
      functionalRequirements: JSON.stringify([
        "Support multiple vehicle types: Motorcycle, Compact Car, Large SUV/Truck, and Electric Vehicle.",
        "Support multiple parking spot types matching vehicle sizes (Motorcycle, Compact, Large, Electric with Charger).",
        "Automated spot assignment: When a vehicle enters, allocate the nearest available compatible spot on the lowest floor.",
        "Ticket management: Issue a unique timestamped parking ticket on entry referencing vehicle and allocated spot.",
        "Dynamic fee calculation: Support multiple pricing strategies (flat hourly rate, vehicle-type specific rate, and peak-hour dynamic surge pricing).",
        "Real-time availability monitoring: Provide real-time counts of available and occupied spots per floor and per vehicle type.",
        "Process exit and release: Validate ticket, calculate fee, process payment, and immediately release the parking spot for other vehicles.",
      ]),
      assumptions: JSON.stringify([
        "The parking lot has multiple floors (e.g., 3-5 floors) with multiple entry and exit gates.",
        "Payment is made at exit gates via Cash, Card, or UPI.",
        "Sensors notify the system when a vehicle enters or vacates a spot.",
        "Electric vehicles can park in electric spots or standard compact/large spots if chargers are not needed.",
      ]),
      constraints: JSON.stringify([
        "Thread-safety / Concurrency: Multiple vehicles arriving simultaneously at different entry gates must never be allocated the same parking spot.",
        "Low latency: Spot allocation and ticket generation must execute in near constant time O(1) or O(log N).",
        "Extensibility: Adding a new vehicle type (e.g., Bus, Autonomous Pod) or a new pricing strategy must not require rewriting existing classes (Open-Closed Principle).",
      ]),
      expectedDesignAreas: JSON.stringify([
        "Core Domain Entities: Vehicle hierarchy, ParkingSpot hierarchy, ParkingFloor, ParkingLot, ParkingTicket.",
        "Spot Allocation Strategy: Interface-driven allocation (e.g., NearestSpotStrategy, FloorPreferenceStrategy).",
        "Fee Calculation Engine: Strategy Pattern for pricing (HourlyFeeStrategy, PeakSurgeFeeStrategy, VehicleSpecificFeeStrategy).",
        "Terminal / Gate Controllers: EntryGate and ExitGate orchestrating spot assignment and ticket lifecycle.",
        "Availability Tracking: Observer Pattern or Event-driven notification for display boards on each floor.",
      ]),
      sampleEdgeCases: JSON.stringify([
        "Parking lot is completely full when a vehicle arrives.",
        "No spots available for a specific vehicle type (e.g., Large Truck) while compact spots remain open.",
        "Customer loses their ticket (lost ticket penalty policy).",
        "Vehicle stays over 24 hours (cross-day pricing calculation).",
        "Concurrent race condition: Two compact cars reach different gates at the exact same millisecond with only one spot left.",
      ]),
    },
    {
      slug: "elevator-system",
      title: "Design an Elevator Control System",
      difficulty: "MEDIUM",
      shortDescription:
        "Design an object-oriented controller for an intelligent multi-car elevator bank servicing a high-rise building with optimal dispatching, request scheduling, and door safety mechanics.",
      problemStatement: `Design a low-level architecture for a multi-elevator system in a modern building with N floors and M elevator cars.
The system receives external hall calls (passengers requesting an elevator from a floor going UP or DOWN) and internal car requests (passengers inside a car selecting a destination floor).

Your design must model car state transitions cleanly, decouple request dispatching algorithms from hardware control, and handle safety invariants like door obstructions and weight limits.`,
      functionalRequirements: JSON.stringify([
        "Multi-car management: Coordinate M elevator cars operating across N floors.",
        "Hall calls: Support external requests from any floor specifying the desired direction (UP or DOWN).",
        "Internal car calls: Support internal button presses inside an elevator car specifying a destination floor.",
        "Dispatch algorithm: Intelligently assign external hall calls to the most optimal car (e.g., LOOK / SCAN algorithm, minimizing wait times and energy consumption).",
        "Car state lifecycle: Accurately model car states: IDLE, MOVING_UP, MOVING_DOWN, DOOR_OPEN, MAINTENANCE.",
        "Door safety & limits: Model door opening, closing, obstruction detection, and weight capacity warning.",
        "Emergency handling: Support emergency stop button and building fire alarm modes.",
      ]),
      assumptions: JSON.stringify([
        "All elevator cars can access all floors.",
        "Floors are numbered 1 to N (with optional basement levels).",
        "Sensors signal when an elevator passes a floor, reaches a destination, or detects door blockage.",
        "Elevator speed and acceleration are assumed uniform for simulation.",
      ]),
      constraints: JSON.stringify([
        "Starvation prevention: Passengers waiting on any floor must eventually be served without being bypassed indefinitely.",
        "State consistency: An elevator moving UP must not instantly reverse direction while there are pending upward requests inside or above it.",
        "Decoupled scheduling: The dispatch algorithm must be easily swappable without modifying the ElevatorCar or Controller classes.",
      ]),
      expectedDesignAreas: JSON.stringify([
        "State Pattern: Cleanly manage ElevatorCar state transitions (IdleState, MovingUpState, MovingDownState, DoorOpenState).",
        "Strategy Pattern: Dispatcher interface (ScanDispatcher, ProximityDispatcher, EnergySaverDispatcher).",
        "Command Pattern / Request Model: InternalRequest vs ExternalRequest encapsulated as first-class domain objects.",
        "Observer Pattern: Floor display screens and sound chimes listening to car movement updates.",
        "Controller Singleton / Mediator: ElevatorSystem acting as mediator between request collectors and car fleets.",
      ]),
      sampleEdgeCases: JSON.stringify([
        "Maximum weight capacity exceeded when passengers enter: prevent doors from closing and sound chime.",
        "Door obstruction detected (optical beam broken): immediately reverse door closing cycle.",
        "Emergency stop button pressed while moving between Floor 4 and Floor 5.",
        "All elevators are idle on the ground floor when multiple requests arrive on high floors.",
        "Power failure / fire alarm triggered: all cars proceed to nearest floor, open doors, and transition to MAINTENANCE.",
      ]),
    },
    {
      slug: "vending-machine",
      title: "Design a State-Driven Vending Machine",
      difficulty: "EASY",
      shortDescription:
        "Design a robust, finite-state-machine-driven vending machine handling product inventory, multi-denomination payment acceptance, change calculation, and transaction cancellations.",
      problemStatement: `Design an object-oriented software system powering an automated vending machine.
The machine displays products organized by rack/aisle codes (e.g., A1, B2), accepts coins and cash in various denominations, validates payments, dispenses products, and calculates optimal change.

The architecture must demonstrate clear application of the State Pattern to prevent invalid operations (such as dispensing without payment or modifying selection mid-dispense).`,
      functionalRequirements: JSON.stringify([
        "Product catalog and inventory: Support multiple items (snacks, beverages) arranged in aisles with price and stock counts.",
        "Multi-currency / Denomination acceptance: Accept coins (1, 5, 10, 25 cents) and cash bills (1, 5, 10 dollars).",
        "Transaction lifecycle: Select product, insert currency, validate sufficient payment, dispense product, and return remaining change.",
        "Change dispenser: Calculate and dispense change using available coin inventory; alert if exact change cannot be provided.",
        "Cancellation / Refund: Allow user to cancel transaction prior to dispensing and receive a 100% refund of inserted money.",
        "Maintenance operations: Support operator replenishment of inventory and cash/coin reservoirs.",
      ]),
      assumptions: JSON.stringify([
        "Items are stored in distinct slots (racks/coils) with finite capacity.",
        "Hardware sensors verify that the product has dropped into the collection tray before completing the sale.",
        "Only valid physical currency denominations configured in the system are accepted.",
      ]),
      constraints: JSON.stringify([
        "Transaction atomicity: If dispensing fails (product jammed) or change cannot be dispensed, the transaction must roll back cleanly and return inserted funds.",
        "Strict state transitions: Buttons must only trigger valid operations corresponding to the machine's current state.",
        "Extensibility: Easy to introduce cashless payments (NFC / QR Code) without modifying core inventory or state logic.",
      ]),
      expectedDesignAreas: JSON.stringify([
        "State Pattern: VendingMachineState interface with concrete states (ReadyState, HasMoneyState, DispenseState, SoldOutState).",
        "Inventory Management: Rack, Item, ItemType, and InventoryTracker classes.",
        "Coin / Cash Reservoir: CashManager tracking denomination counts and calculating change using greedy/DP algorithms.",
        "Payment Strategy: PaymentMethod interface (CashPayment, CardPayment, ContactlessPayment).",
      ]),
      sampleEdgeCases: JSON.stringify([
        "User selects an item that is out of stock (Sold Out).",
        "User inserts insufficient funds and presses dispense.",
        "User inserts $10 for a $2 item, but the machine lacks coins to return $8 change: transaction aborted and full $10 refunded.",
        "User cancels after inserting $5 bill: system must dispense the refund immediately.",
        "Mechanical drop sensor fails to detect dropped item: trigger refund and alert operator.",
      ]),
    },
    {
      slug: "cinema-booking",
      title: "Design a Movie Ticket / Cinema Booking System",
      difficulty: "HARD",
      shortDescription:
        "Design a cinema reservation platform handling theater halls, dynamic seating tiers, temporary seat locks during checkout, concurrency control against double-booking, and payment orchestration.",
      problemStatement: `Design a low-level object-oriented architecture for a movie theater booking platform (such as BookMyShow or Fandango).
The system supports multiple cinema complexes, each with multiple screening halls (auditoriums), showing movies at various times. Customers can browse seats on an interactive layout, lock chosen seats temporarily during payment, and receive confirmed digital tickets upon success.

Your design must solve the critical concurrency challenge: preventing two customers from booking the same seat simultaneously under high demand.`,
      functionalRequirements: JSON.stringify([
        "Catalog management: Model Cinemas, Halls, Movies, and Shows (a specific Movie screened in a specific Hall at a given DateTime).",
        "Seating tiers: Support different seat categories (Silver, Gold, VIP/Recliner) with tier-specific pricing.",
        "Seat selection & temporary lock: When a customer selects seats, lock them exclusively for a configurable window (e.g., 5 or 10 minutes) while they complete checkout.",
        "Lock expiration: If payment is not completed within the lock duration, automatically release seats back to the available pool.",
        "Booking confirmation: On successful payment, transition seats to PERMANENTLY_BOOKED and issue a unique Booking record with ticket details.",
        "Cancellation & refunds: Support user-initiated booking cancellation with partial or full refunds based on showtime proximity.",
        "Discount & coupon system: Apply promotional discount codes or coupon strategies dynamically.",
      ]),
      assumptions: JSON.stringify([
        "A single cinema has multiple screening halls running shows in parallel.",
        "Payments are processed through an external payment gateway adapter.",
        "Notification service (email/SMS) sends digital tickets to customers.",
      ]),
      constraints: JSON.stringify([
        "Zero double-booking: Concurrency safety is the top priority. Under high contention, no two users can reserve the same seat for the same show.",
        "High availability for browsing: Browsing movie schedules and viewing seat maps must remain fast and read-optimized.",
        "Clean separation: Decouple seat locking mechanisms from payment and show scheduling.",
      ]),
      expectedDesignAreas: JSON.stringify([
        "Core Models: Cinema, Hall, Movie, Show, Seat, ShowSeat, Booking, Payment, Ticket.",
        "Seat State Machine: Available -> Locked (with TTL) -> Booked (or released back to Available).",
        "Lock Manager / Concurrency Handler: ReservationLockManager handling atomic seat locking and expiration timers.",
        "Pricing Strategy: Strategy Pattern for show pricing (BaseTierPricing, WeekendSurgePricing, LoyaltyDiscountPricing).",
        "Payment & Notification Orchestration: Facade / Service coordinating checkout, gateway calls, and ticket generation.",
      ]),
      sampleEdgeCases: JSON.stringify([
        "Two users click 'Book' on Seat C12 at the exact same millisecond: only one succeeds, the other receives 'Seat already reserved'.",
        "Payment succeeds at 4 minutes 59 seconds of a 5-minute lock window: booking completes successfully without race condition.",
        "Payment gateway times out or fails: lock is immediately freed or allowed to expire cleanly.",
        "Customer tries to cancel a booking 15 minutes before showtime (policy prohibits cancellation within 1 hour).",
        "Screening is canceled due to technical fault in the hall: bulk refund and cancellation workflow.",
      ]),
    },
  ];

  for (const prob of problems) {
    const created = await prisma.problem.create({
      data: prob,
    });
    console.log(`Created problem: ${created.title} (${created.slug})`);
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
