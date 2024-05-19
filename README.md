## Credits
- https://workos.com/docs/audit-logs

## Introduction
Audit Logs are a collection of events that contain information relevant
to notable actions taken by users in your application.
Every event in the collection contains details regarding
- what kind of action was taken (action),
- who performed the action (actor),
- what resources were affected by the action (targets), and
- additional details of when and where the action took place.

```js
{
  "action": "user.signed_in",
  "occurred_at": "2022-08-29T19:47:52.336Z",
  "actor": {
    "type": "user",
    "id": "user_01GBNJC3MX9ZZJW1FSTF4C5938",
    "metadata": {
      "role": "admin"
    }
  },
  "targets": [
    {
      "type": "user",
      "id": "user_98432YHF",
      "name": "Jon Smith"
    },
    {
      "type": "team",
      "id": "team_01GBNJD4MKHVKJGEWK42JNMBGS",
      "metadata": {
        "owner": "user_01GBTCQ2"
      }
    }
  ],
  "context": {
    "location": "123.123.123.123",
    "user_agent": "Chrome/104.0.0.0"
  },
  "metadata": {
    "extra": "data"
  }
}
```

These events are similar to application logs and analytic events, but are fundamentally different in their intent.
They aren't typically used for active monitoring/alerting,
rather they exist as a paper trail of potentially sensitive actions
taken by members of an organization for compliance and security reasons.

```js
await auditLogService.createEvent({
  action: 'user.signed_in',
  occurredAt: new Date(),
  actor: {
    type: 'user',
    id: 'user_01GBNJC3MX9ZZJW1FSTF4C5938',
    metadata: {
      "role": "admin"
    }
  },
  targets: [
    {
      type: 'team',
      id: 'team_01GBNJD4MKHVKJGEWK42JNMBGS',
    },
  ],
  context: {
    location: '123.123.123.123',
    userAgent: 'Chrome/104.0.0.0',
  },
});
```

## Events https://workos.com/docs/events

All event objects contain the following attributes:
- event: Distinguishes the event type.
- id: Unique identifier for the event.
- data:	Event payload. Payloads match the corresponding API objects.
- created_at:	Timestamp of when the event occurred.

```js
{
  "event": "user.created",
  "id": "event_02F4KLW3C56P083X43JQXF4FO9",
  "data": {
    "object": "user",
    "id": "user_01E4ZCR3C5A4QZ2Z2JQXGKZJ9E",
    "email": "todd@example.com",
    "first_name": "Todd",
    "last_name": "Rundgren",
    "email_verified": false,
    "profile_picture_url": "https://workoscdn.com/images/v1/123abc",
    "created_at": "2023-11-18T09:18:13.120Z",
    "updated_at": "2023-11-18T09:18:13.120Z"
  },
  "created_at": "2023-11-18T04:18:13.126Z"
}
```
