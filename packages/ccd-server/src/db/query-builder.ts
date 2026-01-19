import type { DailyStats, Session } from '@ccd/types';

/**
 * Query builder for dynamic SQL queries
 */
export class QueryBuilder {
  private query: string;
  private params: (string | number)[];

  constructor(baseQuery: string) {
    this.query = baseQuery;
    this.params = [];
  }

  /**
   * Add WHERE conditions with AND logic
   */
  where(conditions: string[], params: (string | number)[]): this {
    if (conditions.length > 0) {
      this.query += ` WHERE ${conditions.join(' AND ')}`;
      this.params.push(...params);
    }
    return this;
  }

  /**
   * Add ORDER BY clause
   */
  orderBy(order: string): this {
    this.query += ` ORDER BY ${order}`;
    return this;
  }

  /**
   * Add LIMIT and OFFSET clauses
   */
  limit(limit?: number, offset?: number): this {
    if (limit) {
      this.query += ' LIMIT ?';
      this.params.push(limit);
    }
    if (offset) {
      this.query += ' OFFSET ?';
      this.params.push(offset);
    }
    return this;
  }

  /**
   * Build the final query and parameters
   */
  build(): { query: string; params: (string | number)[] } {
    return {
      query: this.query,
      params: this.params
    };
  }

  /**
   * Static method to build session queries
   */
  static buildSessionQuery(options: {
    date?: string;
    from?: string;
    to?: string;
    project?: string;
    limit?: number;
    offset?: number;
    bookmarkedFirst?: boolean;
    bookmarkedOnly?: boolean;
  }): { query: string; params: (string | number)[] } {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (options.date) {
      conditions.push("date(started_at) = ?");
      params.push(options.date);
    } else if (options.from) {
      conditions.push("date(started_at) >= ?");
      params.push(options.from);
      if (options.to) {
        conditions.push("date(started_at) <= ?");
        params.push(options.to);
      }
    }

    if (options.project) {
      conditions.push("project_name = ?");
      params.push(options.project);
    }

    if (options.bookmarkedOnly) {
      conditions.push("is_bookmarked = 1");
    }

    const orderBy = options.bookmarkedFirst
      ? 'is_bookmarked DESC, started_at DESC'
      : 'started_at DESC';

    return new QueryBuilder('SELECT * FROM sessions')
      .where(conditions, params)
      .orderBy(orderBy)
      .limit(options.limit, options.offset)
      .build();
  }

  /**
   * Static method to build daily stats queries
   */
  static buildDailyStatsQuery(options: {
    from?: string;
    to?: string;
    days?: number;
    project?: string;
  }): { query: string; params: (string | number)[] } {
    const params: (string | number)[] = [];

    if (options.project) {
      let query = `
        SELECT
          date(s.started_at) as date,
          COUNT(DISTINCT s.id) as session_count,
          COUNT(m.id) as message_count,
          COALESCE(SUM(m.input_tokens), 0) as total_input_tokens,
          COALESCE(SUM(m.output_tokens), 0) as total_output_tokens
        FROM sessions s
        LEFT JOIN messages m ON s.id = m.session_id
        WHERE s.project_name = ?`;

      params.push(options.project);

      const dateCondition = QueryBuilder.buildDateCondition(options);
      if (dateCondition.condition) {
        query += ` AND ${dateCondition.condition}`;
        params.push(...dateCondition.params);
      }

      query += ' GROUP BY date(s.started_at) ORDER BY date(s.started_at) ASC';
      return { query, params };
    } else {
      const conditions: string[] = [];
      const dateCondition = QueryBuilder.buildDateCondition(options);

      if (dateCondition.condition) {
        conditions.push(dateCondition.condition);
        params.push(...dateCondition.params);
      }

      return new QueryBuilder('SELECT * FROM daily_stats')
        .where(conditions, params)
        .orderBy('date ASC')
        .build();
    }
  }

  /**
   * Helper to build date range conditions
   */
  private static buildDateCondition(options: {
    from?: string;
    to?: string;
    days?: number;
  }): { condition: string; params: (string | number)[] } {
    if (options.days) {
      return {
        condition: 'date >= date("now", "-" || ? || " days", "localtime")',
        params: [options.days]
      };
    } else if (options.from) {
      const conditions: string[] = [];
      const params: (string | number)[] = [];

      conditions.push('date >= ?');
      params.push(options.from);

      if (options.to) {
        conditions.push('date <= ?');
        params.push(options.to);
      }

      return {
        condition: conditions.join(' AND '),
        params
      };
    } else {
      return {
        condition: 'date >= date("now", "-7 days", "localtime")',
        params: []
      };
    }
  }
}