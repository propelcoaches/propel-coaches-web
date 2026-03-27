-- ─── Auto-task creation from check-in submissions ────────────────────────────
--
-- Fires when a check-in is submitted (submitted flips to true).
-- Creates one task per check-in for the coach to review it.

CREATE OR REPLACE FUNCTION create_task_from_checkin()
RETURNS TRIGGER AS $$
DECLARE
  v_coach_id    uuid;
  v_client_name text;
BEGIN
  -- Only fire when submitted transitions false → true
  IF NEW.submitted = true AND (OLD.submitted IS NULL OR OLD.submitted = false) THEN

    SELECT coach_id, name
      INTO v_coach_id, v_client_name
      FROM profiles
     WHERE id = NEW.client_id;

    IF v_coach_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Guard against duplicates (e.g. trigger fires twice)
    IF NOT EXISTS (
      SELECT 1 FROM tasks
       WHERE coach_id  = v_coach_id
         AND client_id = NEW.client_id
         AND source    = 'check_in'
         AND created_at >= now() - interval '5 minutes'
    ) THEN
      INSERT INTO tasks (coach_id, client_id, title, source, priority, completed)
      VALUES (
        v_coach_id,
        NEW.client_id,
        'Review ' || COALESCE(v_client_name, 'client') || '''s check-in',
        'check_in',
        'medium',
        false
      );
    END IF;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_checkin_task ON check_ins;
CREATE TRIGGER trigger_checkin_task
  AFTER INSERT OR UPDATE OF submitted ON check_ins
  FOR EACH ROW
  EXECUTE FUNCTION create_task_from_checkin();


-- ─── Auto-task creation from client messages ──────────────────────────────────
--
-- Fires when a client sends a message that looks like a request.
-- Uses simple keyword matching; coaches can dismiss tasks they don't need.
-- A 1-hour cooldown per client prevents flooding.

CREATE OR REPLACE FUNCTION create_task_from_message()
RETURNS TRIGGER AS $$
DECLARE
  v_client_name text;
  v_lower       text;
BEGIN
  -- Only for inbound client messages
  IF NEW.sender_role <> 'client' THEN
    RETURN NEW;
  END IF;

  v_lower := lower(NEW.content);

  -- Request intent keywords
  IF v_lower ~ '(can you|could you|please |would you|i need |i want |update my|change my|adjust my|fix my|send me|give me|add to|remove from|when will|have you)' THEN

    -- Cooldown: skip if a message-sourced task was created in the last hour for this client
    IF EXISTS (
      SELECT 1 FROM tasks
       WHERE coach_id  = NEW.coach_id
         AND client_id = NEW.client_id
         AND source    = 'message'
         AND completed = false
         AND created_at >= now() - interval '1 hour'
    ) THEN
      RETURN NEW;
    END IF;

    SELECT name INTO v_client_name FROM profiles WHERE id = NEW.client_id;

    INSERT INTO tasks (coach_id, client_id, title, description, source, priority, completed)
    VALUES (
      NEW.coach_id,
      NEW.client_id,
      'Follow up with ' || COALESCE(v_client_name, 'client'),
      substring(NEW.content from 1 for 200),
      'message',
      'medium',
      false
    );

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_message_task ON messages;
CREATE TRIGGER trigger_message_task
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_task_from_message();
