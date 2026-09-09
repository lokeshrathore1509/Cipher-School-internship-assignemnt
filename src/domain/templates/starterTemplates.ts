import { StructuredSubmissionPayload } from "../types";

export const STARTER_TEMPLATES: Record<string, StructuredSubmissionPayload> = {
  "parking-lot": {
    requirementsUnderstanding: `1. Manage multi-floor parking lot with multiple gates for vehicle entry and exit.
2. Accommodate diverse vehicle categories: Motorcycle, Compact Car, Large Truck/Bus, Electric Vehicle.
3. Automatically allocate optimal parking spot (nearest available on lowest floor).
4. Dynamic fee calculation based on parking duration, vehicle type, and peak/surge pricing rules.
5. Provide real-time spot occupancy visibility per floor.`,
    assumptions: `- The facility has 4 floors with 50 spots per floor.
- Vehicles receive a unique physical/digital ticket at entry gate containing entry timestamp and spot identifier.
- Payment is collected upon vehicle exit.
- Electric spots feature charging docks; non-electric vehicles cannot occupy electric charging spots.`,
    coreClasses: `Entities & Enums:
- enum VehicleType { MOTORCYCLE, COMPACT, LARGE, ELECTRIC }
- enum SpotType { MOTORCYCLE, COMPACT, LARGE, ELECTRIC }
- enum SpotStatus { AVAILABLE, OCCUPIED, OUT_OF_SERVICE }
- class Vehicle (abstract), Motorcycle, Car, Truck, ElectricVehicle
- class ParkingSpot (abstract), CompactSpot, LargeSpot, etc.
- class ParkingFloor (floorId, spots: Map<SpotType, List<ParkingSpot>>)
- class ParkingLot (singleton orchestrator)
- class ParkingTicket (ticketId, vehicleNumber, spotId, entryTime, issuedGateId)

Strategies & Interfaces:
- interface SpotAllocationStrategy { allocateSpot(floorList, vehicleType): ParkingSpot }
- interface PricingStrategy { calculateFee(ticket, exitTime): number }
- interface PaymentProcessor { processPayment(amount): boolean }`,
    responsibilities: `- ParkingLot: High-level façade coordinating floors, gates, and system-wide capacity.
- ParkingFloor: Tracks localized spot availability and manages spot states for a specific level.
- SpotAllocationStrategy: Encapsulates algorithm for finding nearest/optimal vacant spot (SRP).
- PricingStrategy: Computes monetary fee, isolating hourly/surge calculations from the ticket model.
- EntryGate / ExitGate: Handles physical ticket printing and barrier opening/closing.`,
    relationships: `- ParkingLot HAS-A List<ParkingFloor> (Composition).
- ParkingFloor HAS-A List<ParkingSpot> (Composition).
- ParkingLot HAS-A SpotAllocationStrategy (Aggregation/Dependency Injection).
- ParkingLot HAS-A PricingStrategy (Aggregation/Dependency Injection).
- ParkingTicket REFERENCES Vehicle and ParkingSpot (Association).
- Car, Motorcycle, Truck EXTEND Vehicle (Inheritance).`,
    importantMethods: `- ParkingLot.enterVehicle(Vehicle vehicle): ParkingTicket
- ParkingLot.exitVehicle(ParkingTicket ticket): BillReceipt
- SpotAllocationStrategy.findAvailableSpot(List<ParkingFloor> floors, VehicleType type): ParkingSpot
- PricingStrategy.computeAmount(Date entryTime, Date exitTime, VehicleType type): number
- ParkingFloor.getAvailableCount(SpotType type): number`,
    designPatterns: `- Strategy Pattern: For SpotAllocationStrategy (e.g. NearestFirstStrategy vs LowestFloorFirstStrategy) and PricingStrategy (HourlyPricing vs SurgePricing).
- Factory Pattern: For creating Vehicle instances and ParkingSpots.
- Singleton / Repository Pattern: For ParkingLot instance and ticket registry.
- Observer Pattern: To notify floor availability display boards whenever a spot state changes.`,
    edgeCases: `1. Lot Full: Entry gate checks available spots before opening barrier; displays 'FULL' sign.
2. Race Condition / Concurrency: Concurrent entry gates contending for the last available spot. Handled via synchronized spot reservation or optimistic locking on spot version.
3. Lost Ticket: System prompts manual supervisor verification or applies maximum daily flat fee.
4. Overstay / Multi-Day: Fee calculation smoothly handles multi-day duration and midnight rate changes.`,
    tradeOffs: `- Memory vs Concurrency: Pre-indexing available spots per type in concurrent queues enables O(1) spot allocation, but requires memory overhead and synchronization locks when spots are freed.
- Strategy abstraction vs direct code: Added 4 strategy interfaces which increases class count, but makes adding new vehicle types or holiday pricing completely painless without editing core gates.`,
    solutionNotes: `Designed for thread safety and clean open-closed compliance. Future extensions can include automated license plate recognition (ALPR) cameras at entry gates.`,
  },
  "elevator-system": {
    requirementsUnderstanding: `1. Control a bank of M elevators serving N floors.
2. Handle external hall calls (floor + UP/DOWN direction) and internal destination requests.
3. Efficiently dispatch cars to minimize passenger wait times and energy consumption.
4. Model elevator states (IDLE, MOVING_UP, MOVING_DOWN, DOOR_OPEN).
5. Safeguard against door obstruction, overload, and emergency fire events.`,
    assumptions: `- Standard passenger weight limit of 800 kg per car.
- Uniform travel speed between floors (2 seconds per floor).
- Sensors emit events when reaching a floor or detecting door blockage.`,
    coreClasses: `Entities:
- enum Direction { UP, DOWN, IDLE }
- enum CarStatus { IDLE, MOVING, STOPPED, MAINTENANCE }
- class InternalRequest (destinationFloor)
- class HallCall (sourceFloor, direction)
- class ElevatorCar (carId, currentFloor, direction, status, capacity, currentLoad)
- class Door (doorStatus, sensor)
- class ElevatorController (fleet coordinator)

Interfaces:
- interface DispatchStrategy { selectCar(hallCall, List<ElevatorCar>): ElevatorCar }
- interface ElevatorState { onFloorArrival(car, floor); onDoorOpen(car); }`,
    responsibilities: `- ElevatorCar: Encapsulates movement, motor commands, and door states for an individual cab.
- DispatchStrategy: Pure algorithmic component that evaluates which car is best positioned to serve a hall call (LOOK/SCAN logic).
- ElevatorController: Orchestrates hall calls and delegates them to designated car queues.
- Door: Handles safety sensors and open/close timers.`,
    relationships: `- ElevatorController HAS-A List<ElevatorCar> (Composition).
- ElevatorController HAS-A DispatchStrategy (Composition/Strategy).
- ElevatorCar HAS-A Door (Composition).
- ElevatorCar HAS-A ElevatorState (State Pattern).`,
    importantMethods: `- ElevatorController.requestElevator(int floor, Direction dir): void
- ElevatorCar.pressFloorButton(int destinationFloor): void
- ElevatorCar.move(): void
- DispatchStrategy.pickBestElevator(List<ElevatorCar> cars, HallCall call): ElevatorCar
- Door.openDoor(): void; Door.closeDoor(): void`,
    designPatterns: `- State Pattern: Cleanly models car states (IdleState, MovingState, DoorOpenState, MaintenanceState).
- Strategy Pattern: For DispatchStrategy (e.g., ScanDispatcher, ShortestSeekTimeDispatcher).
- Observer Pattern: ElevatorCar notifies floor indicator chimes and controller of position changes.`,
    edgeCases: `1. Weight Overload: Weight sensor halts door closure and triggers audible alarm until excess passengers step off.
2. Door Obstruction: Infrared door beam reversal restarts the door open timer.
3. Fire Alarm / Emergency Stop: Immediately cancel pending hall calls, move car to ground floor, open doors, and lock in maintenance mode.`,
    tradeOffs: `- LOOK/SCAN algorithm vs Simple FCFS: LOOK algorithm requires maintaining two priority queues (upward min-heap and downward max-heap) per car, increasing state complexity, but drastically reduces passenger wait times.`,
    solutionNotes: `All car state transitions are atomic to prevent inconsistent movement directions.`,
  },
  "vending-machine": {
    requirementsUnderstanding: `1. Display item catalog with aisle codes and live inventory counts.
2. Accept multi-denomination coins and bills.
3. Validate sufficient funds, dispense chosen item, and compute exact change.
4. Provide immediate refund upon user cancellation before dispensing.
5. Prevent invalid actions across machine states.`,
    assumptions: `- Standard physical coin/bill acceptor validates genuine currency.
- Drop sensor confirms mechanical delivery before marking transaction complete.`,
    coreClasses: `Entities:
- class Item (id, name, price)
- class ItemShelf / Rack (aisleCode, item, count)
- class Inventory (shelves: Map<string, ItemShelf>)
- class CoinVault (denominations: Map<number, number>)
- class VendingMachine (context)

Interfaces:
- interface VendingMachineState {
    selectItem(code);
    insertMoney(amount);
    dispense();
    cancel();
  }`,
    responsibilities: `- VendingMachine: Context class maintaining inserted balance, current state, and hardware facade.
- VendingMachineState: Subclasses (ReadyState, HasMoneyState, DispensingState, SoldOutState) enforce legal actions for each phase.
- Inventory: Tracks shelf stock and handles replenishment.
- CoinVault: Manages coin counts and calculates change breakdown.`,
    relationships: `- VendingMachine HAS-A VendingMachineState (State Pattern composition).
- VendingMachine HAS-A Inventory (Composition).
- VendingMachine HAS-A CoinVault (Composition).`,
    importantMethods: `- VendingMachine.selectItem(String aisleCode): void
- VendingMachine.insertCurrency(Coin coin): void
- VendingMachine.dispenseItem(): Item
- VendingMachine.cancelTransaction(): List<Coin>
- CoinVault.calculateChange(int amountDue): List<Coin>`,
    designPatterns: `- State Pattern: For machine states (ReadyState, HasMoneyState, DispensingState, SoldOutState).
- Strategy / DP: Greedy coin change algorithm in CoinVault with fallback to DP if non-standard denominations.`,
    edgeCases: `1. Machine cannot provide exact change: Transaction rolls back, refunds user currency, and displays 'Exact Change Only'.
2. Item jams in coil: Drop sensor does not fire -> system re-opens tray or issues full refund and marks rack unavailable.
3. Cancellation after partial insertion: Immediate return of inserted coins.`,
    tradeOffs: `- State Pattern vs Switch Case: State pattern creates ~5 small classes instead of a large switch statement in VendingMachine, improving SRP and readability.`,
    solutionNotes: `Robust rollback mechanisms ensure learner money is never lost on mechanical failures.`,
  },
  "cinema-booking": {
    requirementsUnderstanding: `1. Manage cinemas, screening halls, movies, and scheduled shows.
2. Interactive seat layout with tier pricing (Silver, Gold, Platinum).
3. Temporary seat lock (5-minute countdown) during checkout.
4. Concurrency safety: Guarantee zero double-booking under heavy load.
5. Support checkout, payments, and cancellations.`,
    assumptions: `- Third-party payment gateway integration.
- Lock expiration releases held seats back to the public pool automatically.`,
    coreClasses: `Entities:
- class Cinema, Hall, Movie, Show
- class Seat (row, col, tier)
- class ShowSeat (seatId, showId, status, price)
- enum SeatStatus { AVAILABLE, LOCKED, BOOKED }
- class Booking (bookingId, user, showSeats, totalAmount, bookingStatus)
- class SeatLockManager (tracks TTL lock per seat)

Interfaces:
- interface PricingStrategy { calculatePrice(showSeat): number }
- interface PaymentGatewayAdapter { processPayment(bookingId, amount): boolean }`,
    responsibilities: `- SeatLockManager: Acquires exclusive temporary lease on seats and schedules expiration timer.
- ShowService: Queries schedules and displays real-time seat status.
- BookingOrchestrator: Manages checkout transaction lifecycle (Lock -> Pay -> Confirm).
- PricingStrategy: Applies weekday, weekend, or premium show pricing.`,
    relationships: `- Cinema HAS-A List<Hall>.
- Show REFERENCES Movie and Hall.
- Show HAS-A List<ShowSeat>.
- Booking HAS-A List<ShowSeat>.`,
    importantMethods: `- SeatLockManager.lockSeats(showId, seatIds, userId, lockDuration): boolean
- BookingOrchestrator.createBooking(showId, seatIds, userId): Booking
- BookingOrchestrator.confirmPayment(bookingId, paymentDetails): TicketReceipt
- SeatLockManager.releaseExpiredLocks(): void`,
    designPatterns: `- Strategy Pattern: Dynamic show pricing.
- Adapter Pattern: For 3rd-party payment gateways.
- State Pattern: ShowSeat status lifecycle (Available -> Locked -> Booked).`,
    edgeCases: `1. Race Condition: Two users clicking 'Pay' on the same seat. Handled via atomic DB lock or distributed lease with TTL.
2. Payment gateway timeout right at the 5-minute lock expiration boundary.
3. Show cancellation due to hall maintenance: Triggers automated bulk refund.`,
    tradeOffs: `- Pessimistic Lock vs Optimistic Lock: Optimistic locking with seat versioning provides higher read throughput for seat maps, but requires friendly conflict retry UX.`,
    solutionNotes: `Clean separation between read-heavy seat map browsing and write-heavy lock transactions.`,
  },
};
