import logging
import os

import httpx
from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    RunContext,
    cli,
    function_tool,
    inference,
    room_io,
)
from livekit.plugins import noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

load_dotenv(".env.local")


CMMS_API_URL = os.getenv("CMMS_API_URL", "http://localhost:8000/api")
CMMS_API_TOKEN = os.getenv("CMMS_API_TOKEN", "")


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are the AI Voice Assistant for Spartans FMS, a Computerized Maintenance Management System.
            You help field technicians and maintenance managers handle their tasks hands-free via voice.
            You can check their open work orders, update work order statuses, and check inventory.

            Guidelines:
            - Keep your responses concise, clear, and professional, as they are spoken out loud over a phone or headset.
            - NEVER use complex formatting, emojis, asterisks, or markdown.
            - When reading out work order numbers or IDs, speak them clearly (e.g., "Work Order 1 0 5").""",
        )

    @function_tool
    async def get_open_work_orders(
        self, context: RunContext, status: str = "OPEN"
    ) -> str:
        """Use this tool to find work orders based on their status (e.g., OPEN, IN_PROGRESS).

        Args:
            status: The status of the work orders to retrieve.
        """
        logger.info(f"Fetching work orders with status: {status}")
        headers = {"Authorization": f"Bearer {CMMS_API_TOKEN}"}

        async with httpx.AsyncClient() as client:
            try:
                # Calls existing Express GET /api/work-orders endpoint
                response = await client.get(
                    f"{CMMS_API_URL}/work-orders",
                    params={"status": status},
                    headers=headers,
                )
                response.raise_for_status()
                data = response.json()

                if not data or len(data) == 0:
                    return f"There are no work orders currently in {status} status."

                # Format a concise summary suitable for Voice TTS
                summaries = [
                    f"ID {wo.get('wo_id')}: {wo.get('title', 'No title')}"
                    for wo in data[:3]
                ]
                return (
                    f"I found {len(data)} {status} work orders. The first few are: "
                    + ", ".join(summaries)
                )
            except Exception as e:
                logger.error(f"Error fetching work orders: {e}")
                return "I'm sorry, I encountered an error while trying to fetch the work orders from the backend."

    @function_tool
    async def update_work_order_status(
        self, context: RunContext, wo_id: int, new_status: str
    ) -> str:
        """Use this tool when a technician wants to update the status of a specific work order.

        Args:
            wo_id: The numerical ID of the work order.
            new_status: The new status to set (e.g., 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD').
        """
        logger.info(f"Updating WO {wo_id} to {new_status}")
        headers = {"Authorization": f"Bearer {CMMS_API_TOKEN}"}

        async with httpx.AsyncClient() as client:
            try:
                # Calls existing Express PATCH /api/work-orders/:wo_id/status endpoint
                response = await client.patch(
                    f"{CMMS_API_URL}/work-orders/{wo_id}/status",
                    json={"status": new_status},
                    headers=headers,
                )
                response.raise_for_status()
                return f"Successfully updated work order {wo_id} to {new_status}."
            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP Error: {e.response.text}")
                return "I couldn't update the work order. The server responded with an error."
            except Exception as e:
                logger.error(f"Error updating work order: {e}")
                return f"I'm sorry, I couldn't update work order {wo_id}."


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Set up a voice AI pipeline using OpenAI, Cartesia, Deepgram, and the LiveKit turn detector
    session = AgentSession(
        # Speech-to-text (STT) is your agent's ears, turning the user's speech into text that the LLM can understand
        # See all available models at https://docs.livekit.io/agents/models/stt/
        stt=inference.STT(model="deepgram/nova-3", language="multi"),
        # A Large Language Model (LLM) is your agent's brain, processing user input and generating a response
        # See all available models at https://docs.livekit.io/agents/models/llm/
        llm=inference.LLM(model="openai/gpt-4.1-mini"),
        # Text-to-speech (TTS) is your agent's voice, turning the LLM's text into speech that the user can hear
        # See all available models as well as voice selections at https://docs.livekit.io/agents/models/tts/
        tts=inference.TTS(
            model="cartesia/sonic-3", voice="9626c31c-bec5-4cca-baa8-f8ba9e84c8bc"
        ),
        # VAD and turn detection are used to determine when the user is speaking and when the agent should respond
        # See more at https://docs.livekit.io/agents/build/turns
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        # allow the LLM to generate a response while waiting for the end of turn
        # See more at https://docs.livekit.io/agents/build/audio/#preemptive-generation
        preemptive_generation=True,
    )

    # To use a realtime model instead of a voice pipeline, use the following session setup instead.
    # (Note: This is for the OpenAI Realtime API. For other providers, see https://docs.livekit.io/agents/models/realtime/))
    # 1. Install livekit-agents[openai]
    # 2. Set OPENAI_API_KEY in .env.local
    # 3. Add `from livekit.plugins import openai` to the top of this file
    # 4. Use the following session setup instead of the version above
    # session = AgentSession(
    #     llm=openai.realtime.RealtimeModel(voice="marin")
    # )

    # # Add a virtual avatar to the session, if desired
    # # For other providers, see https://docs.livekit.io/agents/models/avatar/
    # avatar = hedra.AvatarSession(
    #   avatar_id="...",  # See https://docs.livekit.io/agents/models/avatar/plugins/hedra
    # )
    # # Start the avatar and wait for it to join
    # await avatar.start(session, room=ctx.room)

    # Start the session, which initializes the voice pipeline and warms up the models
    await session.start(
        agent=Assistant(),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: (
                    noise_cancellation.BVCTelephony()
                    if params.participant.kind
                    == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                    else noise_cancellation.BVC()
                ),
            ),
        ),
    )

    # Join the room and connect to the user
    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(server)
