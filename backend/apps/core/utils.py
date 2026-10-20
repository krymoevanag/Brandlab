def get_branch_prefix(branch_code: str) -> str:
    """
    Normalizes branch codes to the A to Z branch numbering scheme:
    - Nairobi (NBI, AZNR, NAIROBI) -> 'AZNr'
    - Meru (MER, AZMR, MERU) -> 'AZMr'
    """
    if not branch_code:
        return "AZNr"
    code_upper = str(branch_code).strip().upper()
    mapping = {
        "NBI": "AZNr",
        "AZNR": "AZNr",
        "NAIROBI": "AZNr",
        "MER": "AZMr",
        "AZMR": "AZMr",
        "MERU": "AZMr",
    }
    return mapping.get(code_upper, str(branch_code).strip())
