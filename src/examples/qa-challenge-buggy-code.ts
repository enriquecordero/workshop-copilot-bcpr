/**
 * ARCHIVO DE RETO QA - CONTIENE BUGS INTENCIONALES
 *
 * Este archivo simula codigo generado por AI que "se ve bien" pero tiene defectos.
 * Los participantes deben usar Copilot y el agente BCPR QA para encontrarlos.
 *
 * INSTRUCCIONES:
 * 1. NO leas este archivo directamente buscando bugs
 * 2. Usa Copilot Chat con @workspace para analizarlo
 * 3. Usa el agente BCPR QA para una revision sistematica
 * 4. Hay exactamente 6 bugs. Encuentralos todos.
 *
 * PISTA: Los bugs son del tipo que la AI genera frecuentemente:
 * - Validacion faltante
 * - Logica invertida
 * - Manejo de estado incorrecto
 * - Seguridad basica ignorada
 * - Off-by-one / edge cases
 * - Tipos incorrectos que TypeScript no atrapa
 */

import { Injectable, Inject, InjectionToken } from 'injection-js';

// ---- Domain ----

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export class SupportTicket {
  private readonly id: string;
  private readonly userId: string;
  private readonly subject: string;
  private readonly description: string;
  private readonly priority: Priority;
  private status: TicketStatus;
  private readonly createdAt: Date;
  private resolvedAt: Date | null;

  constructor(
    id: string,
    userId: string,
    subject: string,
    description: string,
    priority: Priority,
  ) {
    this.id = id;
    this.userId = userId;
    this.subject = subject;
    this.description = description;
    this.priority = priority;
    this.status = TicketStatus.OPEN;
    this.createdAt = new Date();
    this.resolvedAt = null;
  }

  getId(): string {
    return this.id;
  }
  getUserId(): string {
    return this.userId;
  }
  getSubject(): string {
    return this.subject;
  }
  getDescription(): string {
    return this.description;
  }
  getPriority(): Priority {
    return this.priority;
  }
  getStatus(): TicketStatus {
    return this.status;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getResolvedAt(): Date | null {
    return this.resolvedAt;
  }

  // BUG 1: resolve() no verifica si ya esta CLOSED.
  // Un ticket cerrado no deberia poder resolverse.
  resolve(): void {
    this.status = TicketStatus.RESOLVED;
    this.resolvedAt = new Date();
  }

  // BUG 2: close() no verifica si esta en RESOLVED.
  // Solo tickets RESOLVED deberian poder cerrarse (no OPEN ni IN_PROGRESS).
  close(): void {
    this.status = TicketStatus.CLOSED;
  }

  // BUG 3: isHighPriority() no incluye CRITICAL.
  // CRITICAL es mas alto que HIGH, deberia incluirse.
  isHighPriority(): boolean {
    return this.priority === Priority.HIGH;
  }
}

// ---- Application Port ----

export interface ReadTicketsPort {
  findByUserId(userId: string): Promise<SupportTicket[]>;
  findById(id: string): Promise<SupportTicket | null>;
}

export const IReadTicketsPortProvider = new InjectionToken<ReadTicketsPort>(
  'IReadTicketsPortProvider',
);

// ---- Use Case ----

interface TicketViewModel {
  id: string;
  subject: string;
  priority: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  ageInDays: number;
}

@Injectable()
export class ListUserTicketsUseCase {
  constructor(
    @Inject(IReadTicketsPortProvider)
    private readonly readPort: ReadTicketsPort,
  ) {}

  async execute(userId: string): Promise<TicketViewModel[]> {
    // BUG 4: No valida que userId no sea vacio o undefined.
    // Deberia lanzar error si userId es falsy.
    const tickets = await this.readPort.findByUserId(userId);

    return tickets.map((ticket) => this.toViewModel(ticket));
  }

  private toViewModel(ticket: SupportTicket): TicketViewModel {
    const now = new Date();
    const created = ticket.getCreatedAt();

    // BUG 5: Calculo de dias incorrecto. Divide entre horas, no entre dias.
    // 1000 * 60 * 60 = milisegundos en una hora, no en un dia.
    // Deberia ser: 1000 * 60 * 60 * 24
    const ageInDays = Math.floor(
      (now.getTime() - created.getTime()) / (1000 * 60 * 60),
    );

    return {
      id: ticket.getId(),
      subject: ticket.getSubject(),
      priority: ticket.getPriority(),
      status: ticket.getStatus(),
      createdAt: created.toISOString(),
      resolvedAt: ticket.getResolvedAt()?.toISOString() ?? null,
      ageInDays,
    };
  }
}

// ---- Controller (fragmento) ----

export class TicketController {
  // BUG 6: El endpoint expone el userId directamente del query param
  // sin sanitizar. Un usuario podria pasar userId de otro usuario
  // y ver sus tickets (IDOR - Insecure Direct Object Reference).
  // Deberia validar que el userId del request match el usuario autenticado.
  async listTickets(req: { query: { userId?: string } }): Promise<{
    success: boolean;
    data: TicketViewModel[];
  }> {
    const userId = req.query.userId as string;
    const useCase = new ListUserTicketsUseCase(null as any);
    const tickets = await useCase.execute(userId);
    return { success: true, data: tickets };
  }
}
