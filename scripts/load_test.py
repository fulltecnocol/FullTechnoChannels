import asyncio
import aiohttp
import time
import statistics

API_URL = "https://membership-backend-1054327025113.us-central1.run.app"
CONCURRENT_USERS = 50
TOTAL_REQUESTS = 500

async def fetch_config(session, results):
    start = time.perf_counter()
    try:
        async with session.get(f"{API_URL}/public/config") as response:
            status = response.status
            await response.json()
            latency = time.perf_counter() - start
            results.append({"status": status, "latency": latency})
    except Exception as e:
        results.append({"status": "error", "error": str(e)})

async def run_load_test():
    print(f"🚀 Iniciando Prueba de Carga: {CONCURRENT_USERS} usuarios concurrentes...")
    results = []
    
    async with aiohttp.ClientSession() as session:
        tasks = []
        for i in range(TOTAL_REQUESTS):
            tasks.append(fetch_config(session, results))
            if len(tasks) >= CONCURRENT_USERS:
                await asyncio.gather(*tasks)
                tasks = []
        
        if tasks:
            await asyncio.gather(*tasks)

    # Analytics
    latencies = [r["latency"] for r in results if "latency" in r]
    errors = [r for r in results if r["status"] != 200]
    
    print("\n" + "="*40)
    print("📈 RESULTADOS DE LA PRUEBA")
    print("="*40)
    print(f"Total de Peticiones: {TOTAL_REQUESTS}")
    print(f"En errores: {len(errors)}")
    
    if latencies:
        print(f"Latencia Media: {statistics.mean(latencies)*1000:.2f}ms")
        print(f"Latencia P95: {statistics.quantiles(latencies, n=20)[18]*1000:.2f}ms")
        print(f"Peticiones/seg: {TOTAL_REQUESTS / sum(latencies):.2f}")
    
    print("="*40)

if __name__ == "__main__":
    asyncio.run(run_load_test())
